import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mongoStorage } from "./mongoStorage";
import { z } from "zod";
import { analyticsService, AnalyticsDateRange } from "./analytics";
import { formatCurryOptions } from "./curry-formatter";
import { registerMealRoutes } from "./meals-routes";
import {
  createOrder,
  handlePaymentSuccess,
  handlePaymentFailure,
  handleWebhookEvent,
  verifyPaymentSignature,
  orderPaymentMap,
  subscriptionPaymentMap,
} from "./razorpay";
import {
  Meal as MealModel,
  CartItem as CartItemModel,
  CurryOption,
  getNextSequence,
} from "../shared/mongoModels";
import { updateOrderDeliveryStatus } from "./delivery-status";
import { deliveryScheduler } from "./delivery-scheduler";
import { smsService } from "./sms-service";
import {
  upload,
  processImage,
  deleteImage,
  serveImageFromMongoDB,
} from "./upload";
import {
  insertSubscriptionSchema,
  insertAddressSchema,
  Meal,
  CartItem,
} from "@shared/schema";
import { seedDatabase } from "./seed";
import { setupAuth } from "./auth";
import { sendDailyDeliveryNotifications } from "./subscription-notifications";
import { ContactReview } from "../shared/mongoModels";

const insertUserPreferencesSchema = z.object({
  userId: z.number(),
  dietaryPreferences: z.array(z.string()).optional(),
  spiceLevel: z.string().optional(),
  allergies: z.array(z.string()).optional(),
});

const insertCustomMealPlanSchema = z.object({
  subscriptionId: z.number(),
  dayOfWeek: z.number(),
  mealId: z.number(),
});

interface CartItemWithMeal extends CartItem {
  meal?: Meal & {
    curryOption?: {
      id: string;
      name: string;
      priceAdjustment: number;
    };
    originalName?: string;
  };
}

// Utility function to calculate subscription status
function calculateSubscriptionStatus(subscription: any) {
  try {
    // Handle various startDate formats from different storage systems
    let startDate;
    if (subscription.startDate) {
      startDate = new Date(subscription.startDate);
    } else if (subscription.start_date) {
      startDate = new Date(subscription.start_date);
    } else if (subscription.createdAt) {
      startDate = new Date(subscription.createdAt);
    } else if (subscription.created_at) {
      startDate = new Date(subscription.created_at);
    } else {
      console.log("No valid date found for subscription:", subscription.id);
      return {
        ...subscription,
        status: "inactive",
        endDate: null,
        daysRemaining: 0,
      };
    }

    const currentDate = new Date();

    // Validate the start date
    if (isNaN(startDate.getTime())) {
      console.log(
        "Invalid start date for subscription:",
        subscription.id,
        "Date value:",
        subscription.startDate || subscription.start_date,
      );
      return {
        ...subscription,
        status: "inactive",
        endDate: null,
        daysRemaining: 0,
      };
    }

    // Get duration from various possible sources
    const planDuration =
      subscription.plan?.duration ||
      subscription.duration ||
      subscription.meals_per_month ||
      subscription.mealsPerMonth ||
      30;

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + planDuration);

    // Validate the end date
    if (isNaN(endDate.getTime())) {
      console.log(
        "Invalid end date calculation for subscription:",
        subscription.id,
      );
      return {
        ...subscription,
        status: "inactive",
        endDate: null,
        daysRemaining: 0,
      };
    }

    // Reset time components for accurate date comparison
    const current = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
    );
    const start = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const end = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    );

    let status = "inactive";
    if (current < start) {
      status = "inactive";
    } else if (current.getTime() === end.getTime()) {
      status = "completed";
    } else if (current >= start && current < end) {
      status = "active";
    } else {
      status = "completed";
    }

    const daysRemaining =
      status === "active"
        ? Math.ceil((end.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const finalEndDate = isNaN(endDate.getTime())
      ? null
      : endDate.toISOString();

    return {
      ...subscription,
      status,
      endDate: finalEndDate,
      daysRemaining,
    };
  } catch (error) {
    console.error(
      "Error calculating subscription status for subscription:",
      subscription.id,
      error,
    );
    return {
      ...subscription,
      status: "inactive",
      endDate: null,
      daysRemaining: 0,
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    await seedDatabase();
  } catch (error) {
    console.error("Error seeding database:", error);
  }

  setupAuth(app);

  // Define middleware functions first
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  const isAdmin = (req: Request, res: Response, next: Function) => {
    const user = req.user as any;

    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }

    next();
  };

  const isManagerOrAdmin = (req: Request, res: Response, next: Function) => {
    const user = req.user as any;

    if (!user || (user.role !== "manager" && user.role !== "admin")) {
      return res
        .status(403)
        .json({ message: "Access denied. Manager privileges required." });
    }

    next();
  };

  // SUBSCRIPTION PLAN UPDATE - MUST BE FIRST TO WORK
  app.put(
    "/api/admin/subscription-plans/:id",
    isAuthenticated,
    isManagerOrAdmin,
    async (req: Request, res: Response) => {
      try {
        console.log("🚀 SUBSCRIPTION PLAN UPDATE WORKING!");
        const planId = req.params.id;
        const updateData = req.body;

        // Update the subscription plan in MongoDB
        const updatedPlan = await mongoStorage.updateSubscriptionPlan(
          planId,
          updateData,
        );

        if (!updatedPlan) {
          return res.status(404).json({
            success: false,
            message: "Subscription plan not found",
          });
        }

        console.log(`✅ Successfully updated subscription plan ${planId}`);
        res.setHeader("Content-Type", "application/json");
        res.status(200).json({
          success: true,
          message: "Plan updated successfully!",
          id: planId,
          data: updatedPlan,
        });
      } catch (error) {
        console.error("Error updating subscription plan:", error);
        res.status(500).json({
          success: false,
          message: "Failed to update subscription plan",
        });
      }
    },
  );

  registerMealRoutes(app);

  app.get("/api/meals", async (req, res) => {
    try {
      console.log("Fetching all meals directly from MongoDB...");

      const meals = await MealModel.find().lean();

      const globalCurryOptions = await CurryOption.find().lean();

      const enhancedMeals = meals.map((meal) => {
        let curryOptionsArray = [];

        if (meal.curryOptions && meal.curryOptions.length > 0) {
          curryOptionsArray = meal.curryOptions.map((option: any) => [
            option.id,
            option.name,
            option.priceAdjustment,
          ]);
        } else {
          const mealSpecificOptions = globalCurryOptions.filter(
            (option: any) =>
              option.mealId === null || option.mealId === meal.id,
          );

          curryOptionsArray = mealSpecificOptions.map((option: any) => [
            option.id,
            option.name,
            option.priceAdjustment,
          ]);
        }

        return {
          ...meal,
          curryOptions: curryOptionsArray,
        };
      });

      console.log(`Retrieved ${meals.length} meals from MongoDB`);
      res.json(enhancedMeals);
    } catch (err) {
      console.error("Error fetching meals:", err);
      res.status(500).json({ message: "Error fetching meals" });
    }
  });

  app.get("/api/meals/:id", async (req, res) => {
    try {
      const mealId = parseInt(req.params.id);

      const meal = await MealModel.findOne({ id: mealId }).lean();

      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }

      let curryOptionsArray = [];

      if (meal.curryOptions && meal.curryOptions.length > 0) {
        curryOptionsArray = meal.curryOptions.map((option: any) => [
          option.id,
          option.name,
          option.priceAdjustment,
        ]);
      } else {
        const globalCurryOptions = await CurryOption.find({
          $or: [{ mealId: null }, { mealId: mealId }],
        }).lean();

        curryOptionsArray = globalCurryOptions.map((option: any) => [
          option.id,
          option.name,
          option.priceAdjustment,
        ]);
      }

      const enhancedMeal = {
        ...meal,
        curryOptions: curryOptionsArray,
      };

      res.json(enhancedMeal);
    } catch (err) {
      console.error("Error fetching meal:", err);
      res.status(500).json({ message: "Error fetching meal" });
    }
  });

  app.get("/api/meals/type/:type", async (req, res) => {
    try {
      const mealType = req.params.type;

      const meals = await MealModel.find({ mealType }).lean();

      const globalCurryOptions = await CurryOption.find().lean();

      const enhancedMeals = meals.map((meal) => {
        let curryOptionsArray = [];

        if (meal.curryOptions && meal.curryOptions.length > 0) {
          curryOptionsArray = meal.curryOptions;
        } else {
          curryOptionsArray = globalCurryOptions.map((option) => [
            option._id.toString(),
            option.name,
            option.priceAdjustment,
          ]);
        }

        return {
          ...meal,
          curryOptions: curryOptionsArray,
        };
      });

      res.json(enhancedMeals);
    } catch (err) {
      console.error("Error fetching meals by type:", err);
      res.status(500).json({ message: "Error fetching meals by type" });
    }
  });

  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await mongoStorage.getLocations();
      if (!locations || locations.length === 0) {
        console.log(
          "No locations found in database, seeding default locations",
        );
        const defaultLocations = [
          { id: 1, area: "Gachibowli", pincode: "500032", deliveryFee: 30 },
        ];

        for (const location of defaultLocations) {
          await mongoStorage.createLocation(location);
        }
        return res.json(defaultLocations);
      }

      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Error fetching locations" });
    }
  });

  app.get("/api/cart", async (req, res) => {
    try {
      const userId = req.isAuthenticated() ? (req.user as any).id : 0;

      const cartItems = await CartItemModel.find({ userId }).lean();

      const enrichedCartItems = await Promise.all(
        cartItems.map(async (item) => {
          const meal = await MealModel.findOne({ id: item.mealId }).lean();
          const fullMeal = meal
            ? await MealModel.findOne({ id: meal.id }).lean()
            : null;

          const cartItemCurryOptions = (item as any).curryOptions || [];
          let mealWithCurryOption = {
            ...meal,
            curryOptions:
              cartItemCurryOptions.length > 0
                ? cartItemCurryOptions
                : fullMeal?.curryOptions || meal?.curryOptions || [],
          };

          if (meal && item.curryOptionId && item.curryOptionName) {
            (mealWithCurryOption as any).selectedCurry = {
              id: item.curryOptionId,
              name: item.curryOptionName,
              priceAdjustment: item.curryOptionPrice || 0,
            };
          }

          return {
            ...item,
            meal: mealWithCurryOption,
          };
        }),
      );

      res.json(enrichedCartItems);
    } catch (err) {
      console.error("Error fetching cart:", err);
      res.status(500).json({ message: "Error fetching cart items" });
    }
  });

  app.post("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;

      let curryOptionId = null;
      let curryOptionName = null;
      let curryOptionPrice = null;

      if (req.body.selectedCurry) {
        curryOptionId = req.body.selectedCurry.id;
        curryOptionName = req.body.selectedCurry.name;
        curryOptionPrice = req.body.selectedCurry.priceAdjustment || 0;
      }

      const mealDetails = await MealModel.findOne({
        id: req.body.mealId,
      }).lean();

      const mealCurryOptions =
        req.body.curryOptions || mealDetails?.curryOptions || [];
      const cartItemData = {
        ...req.body,
        userId,
        curryOptionId,
        curryOptionName,
        curryOptionPrice,
        curryOptions: mealCurryOptions,
      };

      const cartItem = await mongoStorage.addToCart(cartItemData);
      const mealFromStorage = await mongoStorage.getMeal(cartItem.mealId);

      let mealWithCurryOption = mealFromStorage;

      const mealWithOptions = await MealModel.findOne({
        id: mealFromStorage?.id,
      }).lean();

      mealWithCurryOption = {
        ...mealWithCurryOption,
        curryOptions: mealWithOptions?.curryOptions || mealCurryOptions || [],
      };

      if (curryOptionId && curryOptionName) {
        mealWithCurryOption = {
          ...mealWithCurryOption,
          selectedCurry: {
            id: curryOptionId,
            name: curryOptionName,
            priceAdjustment: curryOptionPrice || 0,
          },
        };
      }

      res.status(201).json({ ...cartItem, meal: mealWithCurryOption });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Error adding to cart:", err);
        res.status(500).json({ message: "Error adding item to cart" });
      }
    }
  });

  app.put("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const { quantity } = req.body;

      const cartItems = await mongoStorage.getCartItems(userId);
      const existingItem = cartItems.find((item) => item.id === itemId);

      if (!existingItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      const updatedItem = await mongoStorage.updateCartItemQuantity(
        itemId,
        quantity,
      );
      const meal = await mongoStorage.getMeal(updatedItem.mealId);

      let mealWithCurryOption = meal;
      if (updatedItem?.curryOptionId && updatedItem.curryOptionName) {
        mealWithCurryOption = {
          ...meal,
          curryOption: {
            id: updatedItem.curryOptionId,
            name: updatedItem.curryOptionName,
            priceAdjustment: updatedItem.curryOptionPrice || 0,
          },
        };
      }

      res.json({ ...updatedItem, meal: mealWithCurryOption });
    } catch (err) {
      console.error("Error updating cart item quantity:", err);
      res.status(500).json({ message: "Error updating cart item quantity" });
    }
  });

  app.patch("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const userId = (req.user as any).id;

      const cartItems = await mongoStorage.getCartItems(userId);
      const existingItem = cartItems.find((item) => item.id === itemId);

      if (!existingItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      const updates = req.body;
      const updatedItem = await mongoStorage.updateCartItem(itemId, updates);
      const meal = await mongoStorage.getMeal(updatedItem.mealId);

      let mealWithCurryOption = meal;
      if (updatedItem?.curryOptionId && updatedItem.curryOptionName) {
        mealWithCurryOption = {
          ...meal,
          curryOption: {
            id: updatedItem.curryOptionId,
            name: updatedItem.curryOptionName,
            priceAdjustment: updatedItem.curryOptionPrice || 0,
          },
        };
      }

      res.json({ ...updatedItem, meal: mealWithCurryOption });
    } catch (err) {
      console.error("Error updating cart item:", err);
      res.status(500).json({ message: "Error updating cart item" });
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const userId = (req.user as any).id;

      const cartItems = await mongoStorage.getCartItems(userId);
      const existingItem = cartItems.find((item: any) => item.id === itemId);

      if (!existingItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      await mongoStorage.removeFromCart(itemId);
      res.status(204).send();
    } catch (err) {
      console.error("Error removing cart item:", err);
      res.status(500).json({ message: "Error removing item from cart" });
    }
  });

  app.delete("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;

      await mongoStorage.clearCart(userId);

      res.status(204).send();
    } catch (err) {
      console.error("Error clearing cart:", err);
      res.status(500).json({ message: "Error clearing cart" });
    }
  });

  app.get("/api/addresses", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;

      const addresses = await mongoStorage.getAddresses(userId);

      res.json(addresses);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      res.status(500).json({ message: "Error fetching addresses" });
    }
  });

  app.get("/api/addresses/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const addressId = parseInt(req.params.id);

      const address = await mongoStorage.getAddressById(addressId);

      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      if (address.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(address);
    } catch (err) {
      console.error("Error fetching address:", err);
      res.status(500).json({ message: "Error fetching address" });
    }
  });

  app.post("/api/addresses", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;

      const addressData = insertAddressSchema.parse({
        ...req.body,
        userId,
      });
      const address = await mongoStorage.createAddress(addressData);
      res.status(201).json(address);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Error creating address:", err);
        res.status(500).json({ message: "Error creating address" });
      }
    }
  });

  app.patch("/api/addresses/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const addressId = parseInt(req.params.id);

      const address = await mongoStorage.getAddressById(addressId);

      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }

      if (address.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedAddress = await mongoStorage.updateAddress(
        addressId,
        req.body,
      );
      res.json(updatedAddress);
    } catch (err) {
      console.error("Error updating address:", err);
      res.status(500).json({ message: "Error updating address" });
    }
  });

  app.delete("/api/addresses/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const addressId = parseInt(req.params.id);

      const address = await mongoStorage.getAddressById(addressId);

      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }

      if (address.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await mongoStorage.deleteAddress(addressId);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting address:", err);
      res.status(500).json({ message: "Error deleting address" });
    }
  });

  app.get("/api/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;

      const preferences = await mongoStorage.getUserPreferences(userId);

      if (!preferences) {
        return res.status(404).json({ message: "User preferences not found" });
      }

      res.json(preferences);
    } catch (err) {
      console.error("Error fetching user preferences:", err);
      res.status(500).json({ message: "Error fetching user preferences" });
    }
  });

  app.post("/api/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const existingPreferences = await mongoStorage.getUserPreferences(userId);

      if (existingPreferences) {
        return res.status(400).json({
          message: "User preferences already exist. Use PATCH to update.",
        });
      }

      const preferencesData = insertUserPreferencesSchema.parse({
        ...req.body,
        userId,
      });

      const preferences =
        await mongoStorage.createUserPreferences(preferencesData);
      res.status(201).json(preferences);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Error creating user preferences:", err);
        res.status(500).json({ message: "Error creating user preferences" });
      }
    }
  });

  app.patch("/api/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;

      const existingPreferences = await mongoStorage.getUserPreferences(userId);

      if (!existingPreferences) {
        return res
          .status(404)
          .json({ message: "User preferences not found. Create them first." });
      }
      const updatedPreferences = await mongoStorage.updateUserPreferences(
        userId,
        req.body,
      );
      res.json(updatedPreferences);
    } catch (err) {
      console.error("Error updating user preferences:", err);
      res.status(500).json({ message: "Error updating user preferences" });
    }
  });

  // Admin API endpoints for subscription plans - unified CRUD endpoint
  app
    .route("/api/admin/subscription-plans")
    .get(isAuthenticated, isManagerOrAdmin, async (req, res) => {
      try {
        const plans = await mongoStorage.getAllSubscriptionPlans();

        // All plans now have menuItems after migration
        const plansWithMenuItems = plans;

        // Group plans by dietary preference for admin portal
        const groupedPlans = [
          {
            dietaryPreference: "veg",
            plans: plansWithMenuItems.filter(
              (plan) => plan.dietaryPreference === "veg",
            ),
            extraPrice: 0,
            id: 1,
          },
          {
            dietaryPreference: "veg_with_egg",
            plans: plansWithMenuItems.filter(
              (plan) => plan.dietaryPreference === "veg_with_egg",
            ),
            extraPrice: 0,
            id: 2,
          },
          {
            dietaryPreference: "nonveg",
            plans: plansWithMenuItems.filter(
              (plan) => plan.dietaryPreference === "nonveg",
            ),
            extraPrice: 0,
            id: 3,
          },
        ].filter((group) => group.plans.length > 0); // Only include groups that have plans

        res.json(groupedPlans);
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
        res.status(500).json({ message: "Error fetching subscription plans" });
      }
    })
    .post(isAuthenticated, isManagerOrAdmin, async (req, res) => {
      try {
        const { action, planData, planId } = req.body;

        if (action === "create") {
          console.log("🚀 Creating subscription plan:", planData);
          const newPlan = await mongoStorage.createSubscriptionPlan(planData);

          res.json({
            success: true,
            message: "Plan created successfully!",
            plan: newPlan,
          });
        } else if (action === "update") {
          console.log("🚀 Updating subscription plan:", planId, planData);
          const updatedPlan = await mongoStorage.updateSubscriptionPlan(
            planId,
            planData,
          );

          res.json({
            success: true,
            message: "Plan updated successfully!",
            plan: updatedPlan,
          });
        } else if (action === "delete") {
          console.log("🚀 Deleting subscription plan:", planId);
          const updatedPlan = await mongoStorage.updateSubscriptionPlan(
            planId,
            { isActive: false },
          );

          res.json({
            success: true,
            message: "Plan deactivated successfully!",
            plan: updatedPlan,
          });
        } else {
          res.status(400).json({ success: false, message: "Invalid action" });
        }
      } catch (error) {
        console.error("Error with subscription plan operation:", error);
        res.status(500).json({
          success: false,
          message: "Error processing subscription plan operation",
        });
      }
    });

  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const activePlans = await mongoStorage.getAllSubscriptionPlans();
      const plansWithMenuItems = activePlans.map((plan) => {
        if (!plan.menuItems || plan.menuItems.length === 0) {
          console.warn(`Plan ${plan.id} missing menuItems, adding default`);
          const defaultMenuItems = [
            { day: 1, main: "Ragi Dosa", sides: ["Coconut Chutney", "Sambar"] },
            { day: 2, main: "Jowar Upma", sides: ["Mixed Vegetable Curry"] },
            { day: 3, main: "Millet Pulao", sides: ["Raita", "Papad"] },
            {
              day: 4,
              main: "Foxtail Millet Lemon Rice",
              sides: ["Boondi Raita"],
            },
            {
              day: 5,
              main: "Little Millet Pongal",
              sides: ["Coconut Chutney"],
            },
            {
              day: 6,
              main: "Barnyard Millet Khichdi",
              sides: ["Pickle", "Curd"],
            },
            {
              day: 7,
              main: "Pearl Millet Roti",
              sides: ["Dal", "Vegetable Curry"],
            },
          ];
          return { ...plan, menuItems: defaultMenuItems };
        }
        return plan;
      });

      const groupedPlans = [
        {
          dietaryPreference: "veg",
          plans: plansWithMenuItems.filter(
            (plan) => plan.dietaryPreference === "veg",
          ),
          extraPrice: 0,
          id: 1,
        },
        {
          dietaryPreference: "veg_with_egg",
          plans: plansWithMenuItems.filter(
            (plan) => plan.dietaryPreference === "veg_with_egg",
          ),
          extraPrice: 0,
          id: 2,
        },
        {
          dietaryPreference: "nonveg",
          plans: plansWithMenuItems.filter(
            (plan) => plan.dietaryPreference === "nonveg",
          ),
          extraPrice: 0,
          id: 3,
        },
      ].filter((group) => group.plans.length > 0);
      res.json(groupedPlans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Public API endpoint for subscription plans (same data as admin, but public access)
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      console.log("📋 Fetching subscription plans for public API");
      const plans = await mongoStorage.getAllSubscriptionPlans();

      // All plans now have menuItems after migration
      const plansWithMenuItems = plans.map((plan) => {
        if (!plan.menuItems || plan.menuItems.length === 0) {
          console.warn(`Plan ${plan.id} missing menuItems, adding default`);
          const defaultMenuItems = [
            { day: 1, main: "Ragi Dosa", sides: ["Coconut Chutney", "Sambar"] },
            { day: 2, main: "Jowar Upma", sides: ["Mixed Vegetable Curry"] },
            { day: 3, main: "Millet Pulao", sides: ["Raita", "Papad"] },
            {
              day: 4,
              main: "Foxtail Millet Lemon Rice",
              sides: ["Boondi Raita"],
            },
            {
              day: 5,
              main: "Little Millet Pongal",
              sides: ["Coconut Chutney"],
            },
            {
              day: 6,
              main: "Barnyard Millet Khichdi",
              sides: ["Pickle", "Curd"],
            },
            {
              day: 7,
              main: "Pearl Millet Roti",
              sides: ["Dal", "Vegetable Curry"],
            },
          ];
          return { ...plan, menuItems: defaultMenuItems };
        }
        return plan;
      });

      // Group plans by dietary preference using the updated plans
      const groupedPlans = [
        {
          dietaryPreference: "veg",
          plans: plansWithMenuItems.filter(
            (plan) => plan.dietaryPreference === "veg",
          ),
          extraPrice: 0,
          id: 1,
        },
        {
          dietaryPreference: "veg_with_egg",
          plans: plansWithMenuItems.filter(
            (plan) => plan.dietaryPreference === "veg_with_egg",
          ),
          extraPrice: 0,
          id: 2,
        },
        {
          dietaryPreference: "nonveg",
          plans: plansWithMenuItems.filter(
            (plan) => plan.dietaryPreference === "nonveg",
          ),
          extraPrice: 0,
          id: 3,
        },
      ].filter((group) => group.plans.length > 0);

      console.log(
        `📋 Retrieved ${plans.length} subscription plans for public API`,
      );
      res.json(groupedPlans);
    } catch (error) {
      console.error("Error fetching public subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get("/api/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const subscriptions = await mongoStorage.getSubscriptionsByUserId(userId);

      // Calculate status for each subscription with enhanced error handling
      const subscriptionsWithStatus = subscriptions.map((subscription: any) => {
        try {
          return calculateSubscriptionStatus(subscription);
        } catch (statusError) {
          console.error(
            "Failed to calculate status for subscription:",
            subscription.id,
            statusError,
          );
          // Return subscription with default status to prevent complete failure
          return {
            ...subscription,
            status: "inactive",
            endDate: null,
            daysRemaining: 0,
          };
        }
      });

      res.json(subscriptionsWithStatus);
    } catch (err) {
      console.error("Error fetching user subscriptions:", err);
      res.status(500).json({ message: "Error fetching subscriptions" });
    }
  });

  app.get("/api/subscriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).role === "admin";
      const subscriptionId = parseInt(req.params.id);

      const subscription = await mongoStorage.getSubscription(subscriptionId);

      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      if (subscription.userId !== userId && !isAdmin) {
        return res.status(403).json({
          message: "You do not have permission to access this subscription",
        });
      }

      // Calculate status for the subscription
      const subscriptionWithStatus = calculateSubscriptionStatus(subscription);

      res.json(subscriptionWithStatus);
    } catch (err) {
      console.error("Error fetching subscription:", err);
      res.status(500).json({ message: "Error fetching subscription" });
    }
  });
  app.post(
    "/api/subscriptions/generate-id",
    isAuthenticated,
    async (req, res) => {
      try {
        const id = await getNextSequence("subscription");
        res.status(200).json({ id });
      } catch (error) {
        console.error("Error generating subscription ID:", error);
        res.status(500).json({ message: "Failed to generate subscription ID" });
      }
    },
  );

  app.post("/api/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const requestData = {
        ...req.body,
        userId,
        startDate: req.body.startDate
          ? new Date(req.body.startDate)
          : undefined,
        id: req.body.id,
      };

      const subscriptionData = insertSubscriptionSchema.parse(requestData);

      const subscription =
        await mongoStorage.createSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Error creating subscriptionRoute:", err);
        res.status(500).json({ message: "Error creating subscriptionADAS" });
      }
    }
  });
  app.post(
    "/api/subscriptions/:id/modify",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const subscriptionId = parseInt(req.params.id, 10);
        const { resumeDate, timeSlot, deliveryAddressId, personCount } =
          req.body;

        const parsedResumeDate = new Date(resumeDate);
        if (!resumeDate || isNaN(parsedResumeDate.getTime())) {
          return res
            .status(400)
            .json({ message: "Invalid or missing resumeDate in request body" });
        }

        const subscription = await mongoStorage.getSubscription(subscriptionId);
        if (!subscription) {
          return res.status(404).json({ message: "Subscription not found" });
        }

        if (subscription.userId !== userId) {
          return res.status(403).json({
            message: "You do not have permission to modify this subscription",
          });
        }

        const planDuration = subscription?.mealsPerMonth;
        if (typeof planDuration !== "number" || planDuration <= 0) {
          console.error(
            "Invalid or missing plan duration for subscription:",
            planDuration,
          );
          return res.status(400).json({
            message: "Invalid or missing plan duration for the subscription.",
          });
        }

        const today = new Date();
        const startDate = new Date(subscription.startDate);

        const deliveredDays = Math.max(
          0,
          Math.floor(
            (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          ) + 1,
        );

        const remainingDays = planDuration - deliveredDays;
        if (remainingDays <= 0) {
          return res
            .status(400)
            .json({ message: "No remaining days in the subscription plan" });
        }

        // Safe date addition
        const addDays = (date: Date, days: number) => {
          const result = new Date(date);
          result.setUTCDate(result.getUTCDate() + days);
          return result;
        };

        const newEndDate =
          remainingDays > 1
            ? addDays(parsedResumeDate, planDuration - 1)
            : addDays(parsedResumeDate, remainingDays - 1);

        const updates = {
          startDate: parsedResumeDate.toISOString(),
          endDate: newEndDate.toISOString(),
          timeSlot,
          deliveryAddressId,
          updatedAt: new Date(),
          personCount,
        };

        const updatedSubscription = await mongoStorage.updateSubscription(
          subscriptionId,
          updates,
        );

        if (!updatedSubscription) {
          return res
            .status(500)
            .json({ message: "Failed to modify subscription" });
        }

        const modifiedSubscriptionWithStatus =
          calculateSubscriptionStatus(updatedSubscription);

        return res.json(modifiedSubscriptionWithStatus);
      } catch (err) {
        console.error("Error modifying subscription:", err);
        return res
          .status(500)
          .json({ message: "Error modifying subscription" });
      }
    },
  );

  app.patch("/api/subscriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const subscriptionId = parseInt(req.params.id);

      const existingSubscription =
        await mongoStorage.getSubscription(subscriptionId);

      if (!existingSubscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      if (existingSubscription.userId !== userId) {
        return res.status(403).json({
          message: "You do not have permission to modify this subscription",
        });
      }

      const updatedSubscription = await mongoStorage.updateSubscription(
        subscriptionId,
        req.body,
      );
      res.json(updatedSubscription);
    } catch (err) {
      console.error("Error updating subscription:", err);
      res.status(500).json({ message: "Error updating subscription" });
    }
  });

  app.get(
    "/api/subscriptions/:id/mealplans",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const subscriptionId = parseInt(req.params.id);

        const existingSubscription =
          await mongoStorage.getSubscription(subscriptionId);

        if (!existingSubscription) {
          return res.status(404).json({ message: "Subscription not found" });
        }

        if (existingSubscription.userId !== userId) {
          return res.status(403).json({
            message: "You do not have permission to access this subscription",
          });
        }

        const mealPlans = await mongoStorage.getCustomMealPlans(subscriptionId);

        const enrichedMealPlans = await Promise.all(
          mealPlans.map(async (plan) => {
            const meal = await mongoStorage.getMeal(plan.mealId);
            return {
              ...plan,
              meal,
            };
          }),
        );

        res.json(enrichedMealPlans);
      } catch (err) {
        console.error("Error fetching custom meal plans:", err);
        res.status(500).json({ message: "Error fetching custom meal plans" });
      }
    },
  );

  app.post(
    "/api/subscriptions/:id/mealplans",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const subscriptionId = parseInt(req.params.id);

        const existingSubscription =
          await mongoStorage.getSubscription(subscriptionId);

        if (!existingSubscription) {
          return res.status(404).json({ message: "Subscription not found" });
        }

        if (existingSubscription.userId !== userId) {
          return res.status(403).json({
            message: "You do not have permission to modify this subscription",
          });
        }

        const mealPlanData = insertCustomMealPlanSchema.parse({
          ...req.body,
          subscriptionId,
        });

        const meal = await mongoStorage.getMeal(mealPlanData.mealId);
        if (!meal) {
          return res.status(404).json({ message: "Meal not found" });
        }

        const mealPlan = await mongoStorage.createCustomMealPlan(mealPlanData);
        res.status(201).json({
          ...mealPlan,
          meal,
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          res
            .status(400)
            .json({ message: "Validation error", errors: err.errors });
        } else {
          console.error("Error creating custom meal plan:", err);
          res.status(500).json({ message: "Error creating custom meal plan" });
        }
      }
    },
  );

  app.delete(
    "/api/subscriptions/:subscriptionId/mealplans/:planId",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const subscriptionId = parseInt(req.params.subscriptionId);
        const planId = parseInt(req.params.planId);

        const existingSubscription =
          await mongoStorage.getSubscription(subscriptionId);

        if (!existingSubscription) {
          return res.status(404).json({ message: "Subscription not found" });
        }

        if (existingSubscription.userId !== userId) {
          return res.status(403).json({
            message: "You do not have permission to modify this subscription",
          });
        }

        const success = await mongoStorage.deleteCustomMealPlan(planId);

        if (!success) {
          return res
            .status(404)
            .json({ message: "Custom meal plan not found" });
        }

        res.status(204).send();
      } catch (err) {
        console.error("Error deleting custom meal plan:", err);
        res.status(500).json({ message: "Error deleting custom meal plan" });
      }
    },
  );

  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const cartItems = await mongoStorage.getCartItems(userId);

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "Your cart is empty" });
      }

      const orderItems = [];
      let totalOrderPrice = 0;

      for (const item of cartItems) {
        const meal = await mongoStorage.getMeal(item.mealId);
        if (!meal) continue;

        const basePrice = item.quantity * meal.price;
        const optionPrice = item.curryOptionPrice
          ? item.quantity * item.curryOptionPrice
          : 0;
        const itemTotalPrice = basePrice + optionPrice;

        totalOrderPrice += itemTotalPrice;

        orderItems.push({
          mealId: item.mealId,
          quantity: item.quantity,
          price: itemTotalPrice,
          notes: item.notes || "",
          curryOptionId: item.curryOptionId || null,
          curryOptionName: item.curryOptionName || null,
          curryOptionPrice: item.curryOptionPrice || 0,
        });
      }

      const deliveryCharge = req.body.deliveryCharge || 0;

      // Create the order with items already included in the order document
      // This prevents duplication because we don't need to call createOrderItem separately
      const order = await mongoStorage.createOrder({
        userId,
        status: "pending",
        deliveryAddress: req.body.deliveryAddress,
        totalPrice: totalOrderPrice + deliveryCharge,
        deliveryCharge,
        items: orderItems,
        createdAt: new Date(),
      });

      // Clear the cart after order is created
      await mongoStorage.clearCart(userId);

      // Send SMS notification for order confirmation
      try {
        const user = await mongoStorage.getUser(userId);
        if (user) {
          let deliveryPhone = null;

          if (req.body.deliveryAddress?.phone) {
            deliveryPhone = req.body.deliveryAddress.phone;
          } else if (req.body.deliveryAddressId) {
            const deliveryAddress = await mongoStorage.getAddressById(
              req.body.deliveryAddressId,
            );
            deliveryPhone = deliveryAddress?.phone;
          }

          // Fallback to user phone if no delivery address phone
          if (!deliveryPhone && user.phone) {
            deliveryPhone = user.phone;
          }

          if (deliveryPhone) {
            const userName = user.name || user.username || "Customer";
            await smsService.sendOrderDeliveryNotification(
              deliveryPhone,
              userName,
              order.id,
              orderItems,
              "Soon", // You can customize this based on your delivery schedule
            );
          }
        }
      } catch (smsError) {
        console.error("Error sending order confirmation SMS:", smsError);
        // Don't fail the order creation if SMS fails
      }

      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Error creating order:", err);
        res.status(500).json({ message: "Error creating order" });
      }
    }
  });

  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const orders = await mongoStorage.getOrdersByUserId(userId);
      res.json(orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const orderId = parseInt(req.params.id);

      const order = await mongoStorage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.userId !== userId) {
        return res
          .status(403)
          .json({ message: "You do not have permission to access this order" });
      }

      const orderItems = await mongoStorage.getOrderItems(orderId);

      const enrichedOrderItems = await Promise.all(
        orderItems.map(async (item) => {
          const meal = await mongoStorage.getMeal(item.mealId);
          return {
            ...item,
            meal,
          };
        }),
      );

      res.json({
        ...order,
        items: enrichedOrderItems,
      });
    } catch (err) {
      console.error("Error fetching order:", err);
      res.status(500).json({ message: "Error fetching order" });
    }
  });

  app.patch("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const orderId = parseInt(req.params.id);
      const { status, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
        req.body;

      const order = await mongoStorage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.userId !== userId && (req.user as any).role !== "admin") {
        return res
          .status(403)
          .json({ message: "You do not have permission to update this order" });
      }

      const allowedTransitions: Record<string, string[]> = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["delivered", "cancelled"],
        delivered: [],
        cancelled: [],
      };

      if (status && order.status !== status) {
        if (!allowedTransitions[order.status].includes(status)) {
          return res.status(400).json({
            message: `Cannot transition order from ${order.status} to ${status}`,
          });
        }
      }

      if (
        status === "confirmed" &&
        razorpayPaymentId &&
        razorpayOrderId &&
        razorpaySignature
      ) {
        const isValid = verifyPaymentSignature(
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        );

        if (!isValid) {
          return res.status(400).json({ message: "Invalid payment signature" });
        }

        orderPaymentMap.set(orderId, {
          razorpayOrderId,
          razorpayPaymentId,
          status: "paid",
        });
      }

      await mongoStorage.updateOrderStatus(orderId, status);
      const updatedOrder = await mongoStorage.getOrder(orderId);

      res.json(updatedOrder);
    } catch (err) {
      console.error("Error updating order:", err);
      res.status(500).json({ message: "Error updating order" });
    }
  });

  app.get("/api/analytics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const dateRange = (req.query.range as AnalyticsDateRange) || "30days";
      const analyticsData = await analyticsService.getAnalytics(dateRange);

      res.json(analyticsData);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      res.status(500).json({ message: "Error fetching analytics data" });
    }
  });

  app.get(
    "/api/admin/orders",
    isAuthenticated,
    isManagerOrAdmin,
    async (req, res) => {
      try {
        const orders = await mongoStorage.getAllOrders();

        const enrichedOrders = await Promise.all(
          orders.map(async (order) => {
            // Get user information
            const user = await mongoStorage.getUser(order.userId);

            // Enhance each order item with meal data
            const enrichedItems = await Promise.all(
              (order.items || []).map(async (item: any) => {
                const meal = await mongoStorage.getMeal(item.mealId);
                return {
                  ...item,
                  meal: meal || { name: `Meal #${item.mealId}` },
                };
              }),
            );

            // Get proper user name - mongodb document may store it differently
            let userName = "Unknown User";
            if (user) {
              // Try different naming conventions that might be in the database
              userName =
                user.name ||
                user.fullName ||
                user.displayName ||
                (user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : null) ||
                user.username ||
                `Customer #${order.userId}`;
            }

            return {
              ...order,
              userName,
              items: enrichedItems,
            };
          }),
        );

        res.json(enrichedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({ message: "Error fetching orders" });
      }
    },
  );

  app.get(
    "/api/admin/subscriptions",
    isAuthenticated,
    isManagerOrAdmin,
    async (req, res) => {
      try {
        const subscriptions = await mongoStorage.getAllSubscriptions();

        const enrichedSubscriptions = await Promise.all(
          subscriptions.map(async (subscription) => {
            const user = await mongoStorage.getUser(subscription.userId);

            // Get proper user name - mongodb document may store it differently
            let userName = "Unknown User";
            if (user) {
              // Try different naming conventions that might be in the database
              userName =
                user.name ||
                user.fullName ||
                user.displayName ||
                (user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : null) ||
                user.username ||
                `Customer #${subscription.userId}`;
            }

            // Calculate subscription status
            const subscriptionWithStatus =
              calculateSubscriptionStatus(subscription);

            return {
              ...subscriptionWithStatus,
              userName,
            };
          }),
        );

        res.json(enrichedSubscriptions);
      } catch (err) {
        console.error("Error fetching subscriptions:", err);
        res.status(500).json({ message: "Error fetching subscriptions" });
      }
    },
  );

  // Update subscription status
  app.patch(
    "/api/admin/subscriptions/:id/status",
    isAuthenticated,
    isManagerOrAdmin,
    async (req, res) => {
      try {
        const subscriptionId = parseInt(req.params.id);
        const { status } = req.body;

        const updatedSubscription = await mongoStorage.updateSubscription(
          subscriptionId,
          {
            status,
            updatedAt: new Date(),
          },
        );

        if (!updatedSubscription) {
          return res.status(404).json({ message: "Subscription not found" });
        }

        res.json(updatedSubscription);
      } catch (err) {
        console.error("Error updating subscription status:", err);
        res.status(500).json({ message: "Error updating subscription status" });
      }
    },
  );

  // Extend subscription
  app.patch(
    "/api/admin/subscriptions/:id/extend",
    isAuthenticated,
    isManagerOrAdmin,
    async (req, res) => {
      try {
        const subscriptionId = parseInt(req.params.id);
        const { days } = req.body;

        const subscription = await mongoStorage.getSubscription(subscriptionId);
        if (!subscription) {
          return res.status(404).json({ message: "Subscription not found" });
        }

        // Calculate new end date
        const currentEndDate = subscription.endDate
          ? new Date(subscription.endDate)
          : new Date(subscription.startDate);
        currentEndDate.setDate(
          currentEndDate.getDate() + (subscription.duration || 30),
        );
        const newEndDate = new Date(currentEndDate);
        newEndDate.setDate(newEndDate.getDate() + days);

        const updatedSubscription = await mongoStorage.updateSubscription(
          subscriptionId,
          {
            endDate: newEndDate,
            updatedAt: new Date(),
          },
        );

        res.json(updatedSubscription);
      } catch (err) {
        console.error("Error extending subscription:", err);
        res.status(500).json({ message: "Error extending subscription" });
      }
    },
  );

  app.patch(
    "/api/admin/orders/:id/status",
    isAuthenticated,
    isManagerOrAdmin,
    async (req, res) => {
      try {
        const orderId = parseInt(req.params.id);
        const { status } = req.body;

        const validStatuses = [
          "pending",
          "confirmed",
          "preparing",
          "in_transit",
          "out_for_delivery",
          "nearby",
          "delivered",
          "cancelled",
        ];

        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }

        const updatedOrder = await mongoStorage.updateOrderStatus(
          orderId,
          status,
        );

        if (!updatedOrder) {
          return res.status(404).json({ message: "Order not found" });
        }

        try {
          let deliveryStatus:
            | "preparing"
            | "in_transit"
            | "out_for_delivery"
            | "nearby"
            | "delivered"
            | null = null;

          switch (status) {
            case "confirmed":
              deliveryStatus = "preparing";
              break;
            case "preparing":
              deliveryStatus = "preparing";
              break;
            case "in_transit":
              deliveryStatus = "in_transit";
              break;
            case "out_for_delivery":
              deliveryStatus = "out_for_delivery";
              break;
            case "nearby":
              deliveryStatus = "nearby";
              break;
            case "delivered":
              deliveryStatus = "delivered";
              break;
          }

          if (deliveryStatus) {
            await updateOrderDeliveryStatus(
              updatedOrder.id,
              updatedOrder.userId,
              deliveryStatus,
            );
          }
        } catch (err) {
          console.error("Failed to send delivery notification:", err);
        }

        res.json(updatedOrder);
      } catch (err) {
        console.error("Error updating order status:", err);
        res.status(500).json({ message: "Error updating order status" });
      }
    },
  );

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await mongoStorage.getAllUsers();
      res.json(users);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userData = req.body;

      const existingUser =
        (await mongoStorage.getUserByUsername(userData.username)) ||
        (await mongoStorage.getUserByEmail(userData.email));

      if (existingUser) {
        return res.status(400).json({
          message: `User with the same ${existingUser.username === userData.username ? "username" : "email"} already exists`,
        });
      }

      const newUser = await mongoStorage.createUser(userData);
      res.status(201).json(newUser);
    } catch (err) {
      console.error("Error creating user:", err);
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.patch(
    "/api/admin/users/:id",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const userData = req.body;

        const updatedUser = await mongoStorage.updateUser(userId, userData);

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json(updatedUser);
      } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({ message: "Error updating user" });
      }
    },
  );

  app.get("/api/admin/meals", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const meals = await MealModel.find().lean();

      const globalCurryOptions = await CurryOption.find().lean();

      const enhancedMeals = meals.map((meal) => {
        if (meal.curryOptions && meal.curryOptions.length > 0) {
          if (
            typeof meal.curryOptions[0] === "object" &&
            !Array.isArray(meal.curryOptions[0])
          ) {
            return meal;
          }

          return {
            ...meal,
            curryOptions: meal.curryOptions.map((option: any) => {
              if (Array.isArray(option)) {
                return {
                  id: option[0],
                  name: option[1],
                  priceAdjustment: option[2],
                };
              }
              return option;
            }),
          };
        } else {
          const mealSpecificOptions = globalCurryOptions.filter(
            (option: any) =>
              option.mealId === null || option.mealId === meal.id,
          );

          return {
            ...meal,
            curryOptions: formatCurryOptions(mealSpecificOptions, meal.id),
          };
        }
      });

      console.log(`Admin: Retrieved ${meals.length} meals from MongoDB`);
      res.json(enhancedMeals);
    } catch (err) {
      console.error("Error fetching meals:", err);
      res.status(500).json({ message: "Error fetching meals" });
    }
  });

  // Image upload endpoint
  app.post(
    "/api/admin/upload-image",
    isAuthenticated,
    isAdmin,
    upload.single("image"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No image file provided" });
        }

        const imageUrl = await processImage(
          req.file.buffer,
          req.file.originalname,
        );
        res.json({ imageUrl });
      } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ message: "Failed to upload image" });
      }
    },
  );

  // Serve images from MongoDB
  app.get("/api/images/:id", serveImageFromMongoDB);

  app.post("/api/admin/meals", isAuthenticated, isAdmin, async (req, res) => {
    try {
      let mealData = { ...req.body };
      console.log("Admin: Creating new meal in MongoDB...");

      if (mealData.curryOptions && Array.isArray(mealData.curryOptions)) {
        mealData.curryOptions = mealData.curryOptions.map((option: any) => {
          if (
            typeof option === "object" &&
            !Array.isArray(option) &&
            option.id
          ) {
            return [option.id, option.name, option.priceAdjustment];
          }
          return option;
        });
      }

      const newMeal = await MealModel.create(mealData);
      console.log(`Admin: Created new meal with ID ${newMeal.id}`);

      const responseData = {
        ...newMeal.toObject(),
        curryOptions: newMeal.curryOptions
          ? formatCurryOptions(newMeal.curryOptions, newMeal.id)
          : [],
      };

      res.status(201).json(responseData);
    } catch (err) {
      console.error("Error creating meal:", err);
      res.status(500).json({ message: "Error creating meal" });
    }
  });

  app.put(
    "/api/admin/meals/:id",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const mealId = parseInt(req.params.id);
        let mealData = { ...req.body };

        console.log(`Admin: Updating meal with ID ${mealId} in MongoDB...`);

        // Get existing meal to check for old image
        const existingMeal = await MealModel.findOne({ id: mealId }).lean();

        if (mealData.curryOptions && Array.isArray(mealData.curryOptions)) {
          mealData.curryOptions = mealData.curryOptions.map((option: any) => {
            if (
              typeof option === "object" &&
              !Array.isArray(option) &&
              option.id
            ) {
              return [option.id, option.name, option.priceAdjustment];
            }
            return option;
          });
        }

        const result = await MealModel.findOneAndUpdate(
          { id: mealId },
          { $set: mealData },
          { new: true },
        ).lean();

        if (!result) {
          console.log(`Admin: Meal with ID ${mealId} not found`);
          return res.status(404).json({ message: "Meal not found" });
        }

        // Delete old image if it was replaced with a new one
        if (
          existingMeal?.imageUrl &&
          mealData.imageUrl &&
          existingMeal.imageUrl !== mealData.imageUrl &&
          existingMeal.imageUrl.startsWith("/api/images/")
        ) {
          await deleteImage(existingMeal.imageUrl);
        }

        const globalCurryOptions = await CurryOption.find().lean();

        const formattedResult = {
          ...result,
          curryOptions:
            result.curryOptions && result.curryOptions.length > 0
              ? formatCurryOptions(result.curryOptions, mealId)
              : formatCurryOptions(
                  globalCurryOptions.filter((option: any) => {
                    const legacyMatch =
                      option.mealId === null || option.mealId === mealId;
                    const arrayMatch =
                      Array.isArray(option.mealIds) &&
                      option.mealIds.includes(mealId);
                    return legacyMatch || arrayMatch;
                  }),
                  mealId,
                ),
        };

        console.log(`Admin: Successfully updated meal with ID ${mealId}`);
        res.json(formattedResult);
      } catch (err) {
        console.error("Error updating meal:", err);
        res.status(500).json({ message: "Error updating meal" });
      }
    },
  );
  app.post(
    "/api/admin/meals/:id/curry-options",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const mealId = parseInt(req.params.id);
        const curryOptionData = req.body;

        console.log(
          `Admin: Creating/updating curry option for meal ID ${mealId}`,
        );

        const meal = await MealModel.findOne({ id: mealId }).lean();
        if (!meal) {
          return res.status(404).json({ message: "Meal not found" });
        }

        if (!curryOptionData.id) {
          curryOptionData.id = `curry_${Date.now()}`;
          curryOptionData.createdAt = new Date();
        }

        if (!curryOptionData.mealIds) {
          curryOptionData.mealIds = [mealId];
        } else if (
          Array.isArray(curryOptionData.mealIds) &&
          !curryOptionData.mealIds.includes(mealId)
        ) {
          curryOptionData.mealIds.push(mealId);
        }

        curryOptionData.mealId = mealId;
        curryOptionData.updatedAt = new Date();

        let curryOption;
        if (curryOptionData.id) {
          const existingOption = await CurryOption.findOne({
            id: curryOptionData.id,
          });

          if (existingOption) {
            curryOption = await CurryOption.findOneAndUpdate(
              { id: curryOptionData.id },
              { $set: curryOptionData },
              { new: true },
            );
          } else {
            curryOption = await CurryOption.create(curryOptionData);
          }
        } else {
          curryOption = await CurryOption.create(curryOptionData);
        }

        if (!curryOption) {
          throw new Error(`Failed to create or update curry option`);
        }

        console.log(
          `Admin: Successfully created/updated curry option with ID ${curryOption.id}`,
        );

        const globalCurryOptions = await CurryOption.find().lean();
        const mealSpecificOptions = globalCurryOptions.filter(
          (option: any) => option.mealId === null || option.mealId === mealId,
        );

        const formattedOptions = formatCurryOptions(
          mealSpecificOptions,
          mealId,
        );

        res.status(201).json({
          message: "Curry option created/updated successfully",
          curryOption,
          allCurryOptions: formattedOptions,
        });
      } catch (error) {
        console.error("Error creating/updating curry option:", error);
        res
          .status(500)
          .json({ message: "Failed to create/update curry option" });
      }
    },
  );

  app.get(
    "/api/admin/meals/:id/curry-options",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const mealId = parseInt(req.params.id);

        const meal = await MealModel.findOne({ id: mealId }).lean();
        if (!meal) {
          return res.status(404).json({ message: "Meal not found" });
        }

        const globalCurryOptions = await CurryOption.find().lean();

        const mealSpecificOptions = globalCurryOptions.filter(
          (option: any) => option.mealId === null || option.mealId === mealId,
        );

        const formattedOptions = formatCurryOptions(
          mealSpecificOptions,
          mealId,
        );

        res.json(formattedOptions);
      } catch (error) {
        console.error("Error fetching curry options for meal:", error);
        res.status(500).json({ message: "Failed to fetch curry options" });
      }
    },
  );

  app.delete(
    "/api/admin/meals/:mealId/curry-options/:id",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const mealId = parseInt(req.params.mealId);
        const curryOptionId = req.params.id;

        const curryOption = await CurryOption.findOne({ id: curryOptionId });
        if (!curryOption) {
          return res.status(404).json({ message: "Curry option not found" });
        }
        await CurryOption.deleteOne({ id: curryOptionId });

        const globalCurryOptions = await CurryOption.find().lean();
        const mealSpecificOptions = globalCurryOptions.filter(
          (option: any) => option.mealId === null || option.mealId === mealId,
        );

        const formattedOptions = formatCurryOptions(
          mealSpecificOptions,
          mealId,
        );

        res.json({
          message: "Curry option deleted successfully",
          allCurryOptions: formattedOptions,
        });
      } catch (error) {
        console.error("Error deleting curry option:", error);
        res.status(500).json({ message: "Failed to delete curry option" });
      }
    },
  );

  app.post(
    "/api/admin/update-prices",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        console.log("Starting price update process...");
        const meals = await MealModel.find({});
        console.log(`Found ${meals.length} meals to update`);

        const updates = [];
        for (const meal of meals) {
          const oldPrice = meal.price;
          const newPrice = Math.round(oldPrice / 100);
          console.log(
            `Updating meal '${meal.name}': ${oldPrice} -> ${newPrice}`,
          );

          meal.price = newPrice;
          updates.push(meal.save());
        }

        await Promise.all(updates);
        console.log("Price update completed successfully!");

        res.json({
          success: true,
          message: `Updated prices for ${meals.length} meals`,
        });
      } catch (err) {
        console.error("Error updating meal prices:", err);
        res.status(500).json({ message: "Error updating meal prices" });
      }
    },
  );

  app.post("/api/payments/create-order", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { amount, orderId, type = "order", notes = {} } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      if (!orderId) {
        return res.status(400).json({ message: "ID is required" });
      }

      let entityType = "order";
      let entity;
      if (type === "subscription") {
        // const subscription = await getNextSequence("subscription");

        // if (!subscription) {
        //   return res.status(404).json({ message: "Subscription not found" });
        // }

        // entity = subscription;
        entityType = "subscription";
      } else if (type === "subscriptionUpgrade") {
        const subscription = await storage.getSubscription(orderId);

        if (!subscription) {
          return res.status(404).json({ message: "Subscription not found" });
        }

        if (subscription.userId !== userId) {
          return res.status(403).json({
            message: "You do not have permission to pay for this subscription",
          });
        }

        entity = subscription;
        entityType = "subscriptionUpgrade";
      } else if (type === "subscriptionRenewal") {
        const subscription = await storage.getSubscription(orderId);

        if (!subscription) {
          return res.status(404).json({ message: "Subscription not found" });
        }

        if (subscription.userId !== userId) {
          return res.status(403).json({
            message: "You do not have permission to pay for this subscription",
          });
        }

        entity = subscription;
        entityType = "subscriptionRenewal";
      } else {
        const order = await storage.getOrder(orderId);

        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }

        if (order.userId !== userId) {
          return res.status(403).json({
            message: "You do not have permission to pay for this order",
          });
        }

        entity = order;
      }
      const razorpayOrder = await createOrder({
        amount,
        receipt: `${entityType}_${orderId}`,
        notes: {
          entityType,
          entityId: orderId.toString(),
          userId: userId.toString(),
          ...notes,
        },
      });

      if (entityType === "subscription") {
        subscriptionPaymentMap.set(orderId, {
          razorpaySubscriptionId: razorpayOrder.id,
          status: "created",
        });
      } else if (entityType === "subscriptionUpgrade") {
        subscriptionPaymentMap.set(orderId, {
          razorpaySubscriptionId: razorpayOrder.id,
          status: "upgrade",
        });
      } else if (entityType === "subscriptionRenewal") {
        subscriptionPaymentMap.set(orderId, {
          razorpaySubscriptionId: razorpayOrder.id,
          status: "renewal",
        });
      } else {
        orderPaymentMap.set(orderId, {
          razorpayOrderId: razorpayOrder.id,
          status: "created",
        });
      }

      res.json({
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err) {
      console.error("Error creating Razorpay order:", err);
      res.status(500).json({ message: "Error creating payment order" });
    }
  });

  app.post("/api/payments/verify", isAuthenticated, async (req, res) => {
    try {
      const {
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        type = "order",
      } = req.body;

      if (
        !orderId ||
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature
      ) {
        return res
          .status(400)
          .json({ message: "Missing required payment verification details" });
      }
      const result = await handlePaymentSuccess(
        parseInt(orderId),
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        type as "order" | "subscription",
      );

      res.json(result);
    } catch (err: any) {
      console.error("Error verifying payment:", err);
      res
        .status(400)
        .json({ message: err.message || "Payment verification failed" });
    }
  });

  app.post("/api/payments/failed", isAuthenticated, async (req, res) => {
    try {
      const { orderId, error } = req.body;

      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }

      const result = await handlePaymentFailure(parseInt(orderId), error);
      res.json(result);
    } catch (err) {
      console.error("Error handling failed payment:", err);
      res.status(500).json({ message: "Error handling failed payment" });
    }
  });

  app.post("/api/webhook/razorpay", async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;

      if (!signature) {
        return res.status(400).json({ message: "Missing Razorpay signature" });
      }
      const result = await handleWebhookEvent(req.body, signature);
      res.json(result);
    } catch (err: any) {
      console.error("Error processing Razorpay webhook:", err);
      res
        .status(400)
        .json({ message: err.message || "Webhook processing failed" });
    }
  });

  app.get("/api/curry-options", async (req, res) => {
    try {
      const curryOptions = await storage.getCurryOptions();
      res.json(curryOptions);
    } catch (error) {
      console.error("Error fetching curry options:", error);
      res.status(500).json({ message: "Failed to fetch curry options" });
    }
  });

  app.get("/api/curry-options/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const curryOption = await storage.getCurryOption(id);

      if (!curryOption) {
        return res.status(404).json({ message: "Curry option not found" });
      }

      res.json(curryOption);
    } catch (error) {
      console.error("Error fetching curry option:", error);
      res.status(500).json({ message: "Failed to fetch curry option" });
    }
  });

  app.get(
    "/api/admin/curry-options",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const curryOptions = await storage.getCurryOptions();
        res.json(curryOptions);
      } catch (error) {
        console.error("Error fetching curry options:", error);
        res.status(500).json({ message: "Failed to fetch curry options" });
      }
    },
  );

  app.post(
    "/api/admin/curry-options",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        let mealIds = req.body.mealIds || [];
        if (mealIds && Array.isArray(mealIds)) {
          mealIds = mealIds.map((id) =>
            typeof id === "string" ? parseInt(id) : id,
          );
        }

        const curryOptionData = {
          id: req.body.id || `curry_${Date.now()}`,
          name: req.body.name,
          description: req.body.description || "",
          priceAdjustment: parseFloat(req.body.priceAdjustment) || 0,
          mealIds: mealIds,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const newCurryOption = await storage.createCurryOption(curryOptionData);
        res.status(201).json(newCurryOption);
      } catch (error) {
        console.error("Error creating curry option:", error);
        res.status(500).json({ message: "Failed to create curry option" });
      }
    },
  );

  app.put(
    "/api/admin/curry-options/:id",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const id = req.params.id;

        if (!id || id === "undefined") {
          return res.status(400).json({ message: "Invalid curry option ID" });
        }
        let mealIds = req.body.mealIds || [];
        if (mealIds && Array.isArray(mealIds)) {
          mealIds = mealIds.map((id) =>
            typeof id === "string" ? parseInt(id) : id,
          );
        }

        const updateData = {
          ...req.body,
          mealIds,
          updatedAt: new Date(),
        };

        const updatedCurryOption = await storage.updateCurryOption(
          id,
          updateData,
        );

        if (!updatedCurryOption) {
          return res.status(404).json({ message: "Curry option not found" });
        }

        res.json(updatedCurryOption);
      } catch (error) {
        console.error("Error updating curry option:", error);
        res.status(500).json({ message: "Failed to update curry option" });
      }
    },
  );

  app.delete(
    "/api/admin/curry-options/:id",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const id = req.params.id;
        const success = await storage.deleteCurryOption(id);

        if (!success) {
          return res.status(404).json({ message: "Curry option not found" });
        }

        res.status(204).send();
      } catch (error) {
        console.error("Error deleting curry option:", error);
        res.status(500).json({ message: "Failed to delete curry option" });
      }
    },
  );

  app.get("/api/meals/:mealId/curry-options", async (req, res) => {
    try {
      const mealId = parseInt(req.params.mealId);
      if (isNaN(mealId)) {
        return res.status(400).json({ message: "Invalid meal ID" });
      }

      const allCurryOptions = await storage.getCurryOptions();
      const mealCurryOptions = allCurryOptions.filter(
        (option: { mealId?: number | null }) =>
          option.mealId === mealId || option.mealId === null,
      );

      res.json(mealCurryOptions);
    } catch (error) {
      console.error("Error fetching meal curry options:", error);
      res.status(500).json({ message: "Failed to fetch meal curry options" });
    }
  });

  // Delivery scheduling endpoints
  app.get(
    "/api/delivery/today",
    isAuthenticated,
    isManagerOrAdmin,
    async (req, res) => {
      try {
        const todayDeliveries = await deliveryScheduler.getTodayDeliveries();
        res.json(todayDeliveries);
      } catch (err) {
        console.error("Error fetching today's deliveries:", err);
        res.status(500).json({ message: "Error fetching delivery schedule" });
      }
    },
  );

  app.get("/api/delivery/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const requestingUserId = (req.user as any).id;
      const isAdmin =
        (req.user as any).role === "admin" ||
        (req.user as any).role === "manager";

      // Users can only see their own deliveries unless they're admin
      if (userId !== requestingUserId && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const userDeliveries = await deliveryScheduler.getUserDeliveries(userId);
      res.json(userDeliveries);
    } catch (err) {
      console.error("Error fetching user deliveries:", err);
      res.status(500).json({ message: "Error fetching user deliveries" });
    }
  });

  app.get(
    "/api/delivery/schedule",
    isAuthenticated,
    isManagerOrAdmin,
    async (req, res) => {
      try {
        const weeklySchedule =
          await deliveryScheduler.getWeeklyDeliverySchedule();
        res.json(weeklySchedule);
      } catch (err) {
        console.error("Error fetching delivery schedule:", err);
        res.status(500).json({ message: "Error fetching delivery schedule" });
      }
    },
  );

  app.get("/api/delivery-status", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { getUserDeliveryStatusUpdates } = await import(
        "./delivery-status"
      );
      const deliveryUpdates = await getUserDeliveryStatusUpdates(userId);
      res.json(deliveryUpdates);
    } catch (err) {
      console.error("Error fetching delivery status:", err);
      res.status(500).json({ message: "Error fetching delivery status" });
    }
  });

  app.delete(
    "/api/admin/delivery-status/clear",
    isAuthenticated,
    isManagerOrAdmin,
    async (req, res) => {
      try {
        const { connectToMongoDB } = await import("./db");
        const { db } = await connectToMongoDB();
        if (!db) throw new Error("Failed to connect to MongoDB");

        const deliveryCollection = db.collection("deliveryStatus");

        // Delete all delivery status records
        const result = await deliveryCollection.deleteMany({});

        res.json({
          message: "Delivery status data cleared",
          deletedCount: result.deletedCount,
        });
      } catch (err) {
        console.error("Error clearing delivery status:", err);
        res.status(500).json({ message: "Error clearing delivery status" });
      }
    },
  );

  // SMS notification endpoints
  app.post(
    "/api/notifications/send-today-deliveries",
    isAuthenticated,
    isManagerOrAdmin,
    async (req, res) => {
      try {
        const todayDeliveries = await deliveryScheduler.getTodayDeliveries();
        const result =
          await smsService.sendTodayDeliveryNotifications(todayDeliveries);

        res.json({
          message: "Notifications processed",
          sent: result.sent,
          failed: result.failed,
          total: todayDeliveries.length,
        });
      } catch (err) {
        console.error("Error sending delivery notifications:", err);
        res.status(500).json({ message: "Error sending notifications" });
      }
    },
  );

  // Subscription daily notifications
  app.post(
    "/api/notifications/send-subscription-notifications",
    isAuthenticated,
    isManagerOrAdmin,
    async (req, res) => {
      try {
        const { sendDailyDeliveryNotifications } = await import(
          "./subscription-notifications"
        );
        const result = await sendDailyDeliveryNotifications();

        res.json({
          message: "Subscription notifications sent",
          sent: result.sent,
          failed: result.failed,
        });
      } catch (err) {
        console.error("Error sending subscription notifications:", err);
        res
          .status(500)
          .json({ message: "Error sending subscription notifications" });
      }
    },
  );

  app.get(
    "/api/notifications/today-subscriptions",
    isAuthenticated,
    isManagerOrAdmin,
    async (req, res) => {
      try {
        const { getTodaySubscriptionDeliveries } = await import(
          "./subscription-notifications"
        );
        const deliveries = await getTodaySubscriptionDeliveries();

        res.json({
          deliveries,
          count: deliveries.length,
          scheduledTime: "6:00 PM",
          deliveryTime: "7:30 PM",
        });
      } catch (err) {
        console.error("Error getting today's subscription deliveries:", err);
        res
          .status(500)
          .json({ message: "Error fetching subscription deliveries" });
      }
    },
  );

  app.post(
    "/api/notifications/delivery-status",
    isAuthenticated,
    isManagerOrAdmin,
    async (req, res) => {
      try {
        const { userId, status, estimatedTime } = req.body;

        if (!userId || !status) {
          return res
            .status(400)
            .json({ message: "userId and status are required" });
        }

        const success = await smsService.sendStatusUpdateNotification(
          userId,
          status,
          estimatedTime,
        );

        if (success) {
          res.json({ message: "Status notification sent successfully" });
        } else {
          res
            .status(500)
            .json({ message: "Failed to send status notification" });
        }
      } catch (err) {
        console.error("Error sending status notification:", err);
        res.status(500).json({ message: "Error sending status notification" });
      }
    },
  );

  app.get("/api/deliveries", isAuthenticated, async (req, res) => {
    try {
      const user = await mongoStorage.getUser(req.user!.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const deliveries = await mongoStorage.getAllDeliveries();
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  });
  app.post("/api/contact-review", async (req, res) => {
    try {
      const { name, email, phone, message, rating } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({
          error: "Name, email, and message are required",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: "Please provide a valid email address",
        });
      }

      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          error: "Rating must be between 1 and 5",
        });
      }

      const contactReview = new ContactReview({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        message: message.trim(),
        rating: rating || 5,
        submittedAt: new Date(),
        status: "new",
      });

      await contactReview.save();

      console.log(`New contact/review submitted by ${name} (${email})`);

      res.status(201).json({
        message: "Thank you for your feedback! We'll get back to you soon.",
        id: contactReview._id,
      });
    } catch (error) {
      console.error("Error saving contact/review:", error);
      res.status(500).json({
        error: "Failed to submit your message. Please try again.",
      });
    }
  });

  app.post("/api/newsletter", async (req, res) => {
    try {
      const result = await mongoStorage.createNewsletterEmail(req.body);
      return res
        .status(201)
        .json({ message: "Subscribed successfully", data: result });
    } catch (error: any) {
      console.error("Newsletter subscription error:", error.message);
      const errorMsg = error.message || "Internal server error";

      const statusCode =
        errorMsg === "Email is required." ||
        errorMsg === "Invalid email format."
          ? 400
          : errorMsg === "Email already subscribed."
            ? 409
            : 500;

      return res.status(statusCode).json({ error: errorMsg });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
