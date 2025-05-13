import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mongoStorage } from "./mongoStorage";
import { z } from "zod";
import { mealPlannerService } from "./mealPlanner";
import { analyticsService, AnalyticsDateRange } from "./analytics";
import { formatCurryOptions, formatMealCurryOptions } from "./curry-formatter";
import { registerMealRoutes } from "./meals-routes";
import {
  createOrder,
  createSubscription,
  createPlan,
  handlePaymentSuccess,
  handlePaymentFailure,
  handleWebhookEvent,
  verifyPaymentSignature,
  orderPaymentMap,
  subscriptionPaymentMap,
  razorpay
} from "./razorpay";
import { 
  Meal as MealModel, 
  CartItem as CartItemModel, 
  CurryOption
} from "../shared/mongoModels";
import { 
  insertUserSchema, 
  insertCartItemSchema, 
  insertOrderSchema,
  insertOrderItemSchema, 
  insertSubscriptionSchema,
  insertUserPreferencesSchema, 
  insertReviewSchema,
  insertCustomMealPlanSchema,
  insertAddressSchema,
  Meal,
  CartItem
} from "@shared/schema";
import { seedDatabase } from "./seed";
import { setupAuth } from "./auth";
import migrateDatabaseCartItems from "./migrate-cart-items";

// Augmented CartItem interface for server use that includes meal data
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Run database migrations
  try {
    await migrateDatabaseCartItems();
    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Error running database migrations:", error);
  }
  
  // Seed the database with initial data (admin users, etc.)
  try {
    await seedDatabase();
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }

  // Setup authentication module
  setupAuth(app);
  
  // Register meal routes with object-formatted curry options
  registerMealRoutes(app);

  // Middleware that ensures authentication
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };
  
  // Middleware to check if user is an admin
  const isAdmin = (req: Request, res: Response, next: Function) => {
    const user = req.user as any;
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
    
    next();
  };
  
  // Middleware to check if user is a manager or admin
  const isManagerOrAdmin = (req: Request, res: Response, next: Function) => {
    const user = req.user as any;
    
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return res.status(403).json({ message: "Access denied. Manager privileges required." });
    }
    
    next();
  };
  
  // Public meal routes
  app.get("/api/meals", async (req, res) => {
    try {
      console.log("Fetching all meals directly from MongoDB...");
      
      // Use MongoDB directly instead of going through storage
      const meals = await MealModel.find().lean();
      
      // Get all curry options from the CurryOption collection
      const globalCurryOptions = await CurryOption.find().lean();
      
      // Enhance each meal with curry options as requested format: [id, curryname, price]
      const enhancedMeals = meals.map(meal => {
        let curryOptionsArray = [];
        
        // If meal has embedded curry options, use those
        if (meal.curryOptions && meal.curryOptions.length > 0) {
          curryOptionsArray = meal.curryOptions.map((option: any) => [
            option.id,
            option.name,
            option.priceAdjustment
          ]);
        } else {
          // Otherwise use applicable global options
          const mealSpecificOptions = globalCurryOptions.filter((option: any) => 
            option.mealId === null || option.mealId === meal.id
          );
          
          curryOptionsArray = mealSpecificOptions.map((option: any) => [
            option.id,
            option.name,
            option.priceAdjustment
          ]);
        }
        
        // Return meal with curry options in the requested format
        return {
          ...meal,
          curryOptions: curryOptionsArray
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
      
      // Use MongoDB directly instead of going through storage
      const meal = await MealModel.findOne({ id: mealId }).lean();
      
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      // Get curry options for this meal
      let curryOptionsArray = [];
      
      // If meal has embedded curry options, use those
      if (meal.curryOptions && meal.curryOptions.length > 0) {
        curryOptionsArray = meal.curryOptions.map((option: any) => [
          option.id,
          option.name,
          option.priceAdjustment
        ]);
      } else {
        // Otherwise get global curry options applicable to this meal
        const globalCurryOptions = await CurryOption.find({
          $or: [{ mealId: null }, { mealId: mealId }]
        }).lean();
        
        curryOptionsArray = globalCurryOptions.map((option: any) => [
          option.id,
          option.name,
          option.priceAdjustment
        ]);
      }
      
      // Add curry options to the meal
      const enhancedMeal = {
        ...meal,
        curryOptions: curryOptionsArray
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
      
      // Use MongoDB directly
      const meals = await MealModel.find({ mealType }).lean();
      
      // Get all curry options from the CurryOption collection
      const globalCurryOptions = await CurryOption.find().lean();
      
      // Enhance each meal with curry options in the requested format
      const enhancedMeals = meals.map(meal => {
        let curryOptionsArray = [];
        
        // If meal has embedded curry options, use those
        if (meal.curryOptions && meal.curryOptions.length > 0) {
          curryOptionsArray = meal.curryOptions;
        } else {
          // Otherwise use global curry options
          curryOptionsArray = globalCurryOptions.map(option => [
            option._id.toString(),
            option.name,
            option.priceAdjustment
          ]);
        }
        
        return {
          ...meal,
          curryOptions: curryOptionsArray
        };
      });
      
      res.json(enhancedMeals);
    } catch (err) {
      console.error("Error fetching meals by type:", err);
      res.status(500).json({ message: "Error fetching meals by type" });
    }
  });
  
  // Location data for delivery areas
  app.get("/api/locations", (req, res) => {
    // Sample data for Hyderabad delivery areas
    const deliveryAreas = [
      { id: 1, area: "Hitech City", pincode: "500081", deliveryFee: 30 },
      { id: 2, area: "Gachibowli", pincode: "500032", deliveryFee: 30 },
      { id: 3, area: "Madhapur", pincode: "500081", deliveryFee: 30 },
      { id: 4, area: "Kondapur", pincode: "500084", deliveryFee: 40 },
      { id: 5, area: "Jubilee Hills", pincode: "500033", deliveryFee: 50 },
      { id: 6, area: "Banjara Hills", pincode: "500034", deliveryFee: 50 },
      { id: 7, area: "Ameerpet", pincode: "500016", deliveryFee: 60 },
      { id: 8, area: "Begumpet", pincode: "500016", deliveryFee: 60 },
      { id: 9, area: "Somajiguda", pincode: "500082", deliveryFee: 70 },
      { id: 10, area: "Kukatpally", pincode: "500072", deliveryFee: 80 }
    ];
    
    res.json(deliveryAreas);
  });
  
  // Cart routes
  app.get("/api/cart", async (req, res) => {
    try {
      const userId = req.isAuthenticated() ? (req.user as any).id : 0;
      
      // Use MongoDB directly instead of going through storage
      const cartItems = await CartItemModel.find({ userId }).lean();
      
      // Enrich cart items with meal details and curry options
      const enrichedCartItems = await Promise.all(
        cartItems.map(async (item) => {
          // Use MongoDB directly to get meal
          const meal = await MealModel.findOne({ id: item.mealId }).lean();
          
          // Create a base enriched meal object
          let mealWithCurryOption = {
            ...meal,
            // Ensure curryOptions exists (either from the meal or as empty array)
            curryOptions: meal?.curryOptions || []
          };
          
          // If the item has curry option selections, add them
          if (meal && item.curryOptionId && item.curryOptionName) {
            
            // The item might not have curry options property, so use type assertion 
            // and default to an empty array
            const itemCurryOptions = (item as any).curryOptions || [];
            (mealWithCurryOption as any).curryOptions = itemCurryOptions;
            
            // If there are no curry options stored in the cart item, but the meal has them, use those
            if (itemCurryOptions.length === 0 && meal.curryOptions) {
              (mealWithCurryOption as any).curryOptions = meal.curryOptions;
            }
            
            // Add the selectedCurry property
            (mealWithCurryOption as any).selectedCurry = {
              id: item.curryOptionId,
              name: item.curryOptionName,
              priceAdjustment: item.curryOptionPrice || 0
            };
          }
          
          return {
            ...item,
            meal: mealWithCurryOption
          };
        })
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
      
      // Handle selected curry if present
      let curryOptionId = null;
      let curryOptionName = null;
      let curryOptionPrice = null;
      
      // Use selectedCurry instead of curryOption
      if (req.body.selectedCurry) {
        curryOptionId = req.body.selectedCurry.id;
        curryOptionName = req.body.selectedCurry.name;
        curryOptionPrice = req.body.selectedCurry.priceAdjustment || 0;
      }
      
      // Extract curryOptions array from request if present
      const mealCurryOptions = req.body.curryOptions || [];
      
      // For MongoDB we'll bypass the schema validation temporarily
      // as we're working directly with MongoDB models
      const cartItemData = {
        ...req.body,
        userId,
        curryOptionId,
        curryOptionName,
        curryOptionPrice,
        curryOptions: mealCurryOptions
      };
      
      // Use MongoDB storage implementation
      const cartItem = await mongoStorage.addToCart(cartItemData);
      const meal = await mongoStorage.getMeal(cartItem.mealId);
      
      // Add curry option to the meal object if needed
      let mealWithCurryOption = meal;
      
      // Always include the original curry options from the request
      if (!mealWithCurryOption.curryOptions || !mealWithCurryOption.curryOptions.length) {
        mealWithCurryOption = {
          ...mealWithCurryOption,
          curryOptions: mealCurryOptions
        };
      }
      
      // Add the selected curry if one was chosen
      if (curryOptionId && curryOptionName) {
        mealWithCurryOption = {
          ...mealWithCurryOption,
          // Add selected curry as a separate property
          selectedCurry: {
            id: curryOptionId,
            name: curryOptionName,
            priceAdjustment: curryOptionPrice || 0
          }
        };
      }
      
      res.status(201).json({ ...cartItem, meal: mealWithCurryOption });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Error adding to cart:", err);
        res.status(500).json({ message: "Error adding item to cart" });
      }
    }
  });

  // PUT endpoint for updating cart item quantity
  app.put("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const { quantity } = req.body;
      
      // Use MongoDB storage implementation directly (already imported at top)
      
      // Verify item belongs to user
      const cartItems = await mongoStorage.getCartItems(userId);
      const existingItem = cartItems.find(item => item.id === itemId);
      
      if (!existingItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Update item quantity
      const updatedItem = await mongoStorage.updateCartItemQuantity(itemId, quantity);
      const meal = await mongoStorage.getMeal(updatedItem.mealId);
      
      // Add curry option to the meal object if needed
      let mealWithCurryOption = meal;
      if (updatedItem?.curryOptionId && updatedItem.curryOptionName) {
        mealWithCurryOption = {
          ...meal,
          curryOption: {
            id: updatedItem.curryOptionId,
            name: updatedItem.curryOptionName,
            priceAdjustment: updatedItem.curryOptionPrice || 0
          }
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
      
      // Use MongoDB storage implementation directly (already imported at top)
      
      // Verify item belongs to user
      const cartItems = await mongoStorage.getCartItems(userId);
      const existingItem = cartItems.find(item => item.id === itemId);
      
      if (!existingItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Update item
      const updates = req.body;
      const updatedItem = await mongoStorage.updateCartItem(itemId, updates);
      const meal = await mongoStorage.getMeal(updatedItem.mealId);
      
      // Add curry option to the meal object if needed
      let mealWithCurryOption = meal;
      if (updatedItem?.curryOptionId && updatedItem.curryOptionName) {
        mealWithCurryOption = {
          ...meal,
          curryOption: {
            id: updatedItem.curryOptionId,
            name: updatedItem.curryOptionName,
            priceAdjustment: updatedItem.curryOptionPrice || 0
          }
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
      
      // Use MongoDB storage implementation directly (already imported at top)
      
      // Verify item belongs to user
      const cartItems = await mongoStorage.getCartItems(userId);
      const existingItem = cartItems.find((item: any) => item.id === itemId);
      
      if (!existingItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Remove item
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
      
      // Use MongoDB storage from imports
      await mongoStorage.clearCart(userId);
      
      res.status(204).send();
    } catch (err) {
      console.error("Error clearing cart:", err);
      res.status(500).json({ message: "Error clearing cart" });
    }
  });
  
  // Address management routes
  app.get("/api/addresses", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Use MongoDB storage implementation directly
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
      
      // Use MongoDB storage implementation directly
      const address = await mongoStorage.getAddressById(addressId);
      
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Ensure the user can only access their own addresses
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
        userId
      });
      
      // Use MongoDB storage implementation directly
      const address = await mongoStorage.createAddress(addressData);
      res.status(201).json(address);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
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
      
      // Use MongoDB storage implementation directly
      const address = await mongoStorage.getAddressById(addressId);
      
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Ensure the user can only update their own addresses
      if (address.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedAddress = await mongoStorage.updateAddress(addressId, req.body);
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
      
      // Use MongoDB storage implementation directly
      const address = await mongoStorage.getAddressById(addressId);
      
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Ensure the user can only delete their own addresses
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
  
  // User preferences routes
  app.get("/api/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Use MongoDB storage implementation directly
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
      
      // Check if preferences already exist - use MongoDB directly
      const existingPreferences = await mongoStorage.getUserPreferences(userId);
      
      if (existingPreferences) {
        return res.status(400).json({ message: "User preferences already exist. Use PATCH to update." });
      }
      
      const preferencesData = insertUserPreferencesSchema.parse({
        ...req.body,
        userId
      });
      
      // Use MongoDB storage implementation directly
      const preferences = await mongoStorage.createUserPreferences(preferencesData);
      res.status(201).json(preferences);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Error creating user preferences:", err);
        res.status(500).json({ message: "Error creating user preferences" });
      }
    }
  });
  
  app.patch("/api/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Ensure preferences exist - use MongoDB directly
      const existingPreferences = await mongoStorage.getUserPreferences(userId);
      
      if (!existingPreferences) {
        return res.status(404).json({ message: "User preferences not found. Create them first." });
      }
      
      // Use MongoDB storage implementation directly
      const updatedPreferences = await mongoStorage.updateUserPreferences(userId, req.body);
      res.json(updatedPreferences);
    } catch (err) {
      console.error("Error updating user preferences:", err);
      res.status(500).json({ message: "Error updating user preferences" });
    }
  });
  
  // Subscription management
  app.get("/api/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      // Use MongoDB storage implementation directly
      const subscriptions = await mongoStorage.getSubscriptionsByUserId(userId);
      res.json(subscriptions);
    } catch (err) {
      console.error("Error fetching user subscriptions:", err);
      res.status(500).json({ message: "Error fetching subscriptions" });
    }
  });
  
  // Get a single subscription by ID
  app.get("/api/subscriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).role === 'admin';
      const subscriptionId = parseInt(req.params.id);
      
      // Use MongoDB storage implementation directly
      const subscription = await mongoStorage.getSubscription(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Allow access only to the owner or an admin
      if (subscription.userId !== userId && !isAdmin) {
        return res.status(403).json({ message: "You do not have permission to access this subscription" });
      }
      
      res.json(subscription);
    } catch (err) {
      console.error("Error fetching subscription:", err);
      res.status(500).json({ message: "Error fetching subscription" });
    }
  });
  
  app.post("/api/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Convert startDate from ISO string to Date object if needed
      const requestData = {
        ...req.body,
        userId,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined
      };
      
      const subscriptionData = insertSubscriptionSchema.parse(requestData);
      
      // Use MongoDB storage implementation directly
      const subscription = await mongoStorage.createSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Error creating subscription:", err);
        res.status(500).json({ message: "Error creating subscription" });
      }
    }
  });
  
  app.patch("/api/subscriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const subscriptionId = parseInt(req.params.id);
      
      // Ensure subscription exists and belongs to the user - use MongoDB directly
      const existingSubscription = await mongoStorage.getSubscription(subscriptionId);
      
      if (!existingSubscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      if (existingSubscription.userId !== userId) {
        return res.status(403).json({ message: "You do not have permission to modify this subscription" });
      }
      
      // Use MongoDB storage implementation directly
      const updatedSubscription = await mongoStorage.updateSubscription(subscriptionId, req.body);
      res.json(updatedSubscription);
    } catch (err) {
      console.error("Error updating subscription:", err);
      res.status(500).json({ message: "Error updating subscription" });
    }
  });
  
  // Custom meal plan routes
  app.get("/api/subscriptions/:id/mealplans", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const subscriptionId = parseInt(req.params.id);
      
      // Ensure subscription exists and belongs to the user - use MongoDB directly
      const existingSubscription = await mongoStorage.getSubscription(subscriptionId);
      
      if (!existingSubscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      if (existingSubscription.userId !== userId) {
        return res.status(403).json({ message: "You do not have permission to access this subscription" });
      }
      
      // Use MongoDB storage implementation directly
      const mealPlans = await mongoStorage.getCustomMealPlans(subscriptionId);
      
      // Enrich meal plans with meal details - use MongoDB directly
      const enrichedMealPlans = await Promise.all(
        mealPlans.map(async (plan) => {
          const meal = await mongoStorage.getMeal(plan.mealId);
          return {
            ...plan,
            meal
          };
        })
      );
      
      res.json(enrichedMealPlans);
    } catch (err) {
      console.error("Error fetching custom meal plans:", err);
      res.status(500).json({ message: "Error fetching custom meal plans" });
    }
  });
  
  app.post("/api/subscriptions/:id/mealplans", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const subscriptionId = parseInt(req.params.id);
      
      // Ensure subscription exists and belongs to the user - use MongoDB directly
      const existingSubscription = await mongoStorage.getSubscription(subscriptionId);
      
      if (!existingSubscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      if (existingSubscription.userId !== userId) {
        return res.status(403).json({ message: "You do not have permission to modify this subscription" });
      }
      
      // Validate custom meal plan data
      const mealPlanData = insertCustomMealPlanSchema.parse({
        ...req.body,
        subscriptionId
      });
      
      // Ensure meal exists - use MongoDB directly
      const meal = await mongoStorage.getMeal(mealPlanData.mealId);
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      // Use MongoDB storage implementation directly
      const mealPlan = await mongoStorage.createCustomMealPlan(mealPlanData);
      res.status(201).json({
        ...mealPlan,
        meal
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Error creating custom meal plan:", err);
        res.status(500).json({ message: "Error creating custom meal plan" });
      }
    }
  });
  
  app.delete("/api/subscriptions/:subscriptionId/mealplans/:planId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const subscriptionId = parseInt(req.params.subscriptionId);
      const planId = parseInt(req.params.planId);
      
      // Ensure subscription exists and belongs to the user - use MongoDB directly
      const existingSubscription = await mongoStorage.getSubscription(subscriptionId);
      
      if (!existingSubscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      if (existingSubscription.userId !== userId) {
        return res.status(403).json({ message: "You do not have permission to modify this subscription" });
      }
      
      // Delete the custom meal plan - use MongoDB directly
      const success = await mongoStorage.deleteCustomMealPlan(planId);
      
      if (!success) {
        return res.status(404).json({ message: "Custom meal plan not found" });
      }
      
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting custom meal plan:", err);
      res.status(500).json({ message: "Error deleting custom meal plan" });
    }
  });
  
  // Order routes
  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Validate order data
      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId
      });
      
      // Create the order with default status
      const orderWithStatus = {
        ...orderData,
        status: "pending" // Adding required status field
      };
      // Use MongoDB storage implementation directly
      const order = await mongoStorage.createOrder(orderWithStatus);
      
      // Create order items from cart if provided
      if (req.body.fromCart) {
        // Get all cart items for the user - use MongoDB directly
        const cartItems = await mongoStorage.getCartItems(userId);
        
        // Create order items from cart items
        for (const cartItem of cartItems) {
          const orderItem = {
            orderId: order.id,
            mealId: cartItem.mealId,
            quantity: cartItem.quantity,
            price: cartItem.quantity * ((await mongoStorage.getMeal(cartItem.mealId))?.price || 0),
            curryOptionId: cartItem.curryOptionId,
            curryOptionName: cartItem.curryOptionName,
            curryOptionPrice: cartItem.curryOptionPrice
          };
          
          // Use MongoDB storage implementation directly
          await mongoStorage.createOrderItem(orderItem);
        }
        
        // Clear the cart - use MongoDB directly
        await mongoStorage.clearCart(userId);
      } else if (req.body.items && Array.isArray(req.body.items)) {
        // Create order items from the provided items array
        for (const item of req.body.items) {
          const orderItem = {
            orderId: order.id,
            mealId: item.mealId,
            quantity: item.quantity,
            price: item.price || item.quantity * ((await mongoStorage.getMeal(item.mealId))?.price || 0),
            curryOptionId: item.curryOptionId,
            curryOptionName: item.curryOptionName,
            curryOptionPrice: item.curryOptionPrice
          };
          
          // Use MongoDB storage implementation directly
          await mongoStorage.createOrderItem(orderItem);
        }
      }
      
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Error creating order:", err);
        res.status(500).json({ message: "Error creating order" });
      }
    }
  });
  
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      // Use MongoDB storage implementation directly
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
      
      // Get the order - use MongoDB directly
      const order = await mongoStorage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Ensure order belongs to the user
      if (order.userId !== userId) {
        return res.status(403).json({ message: "You do not have permission to access this order" });
      }
      
      // Get order items - use MongoDB directly
      const orderItems = await mongoStorage.getOrderItems(orderId);
      
      // Enrich order items with meal details - use MongoDB directly
      const enrichedOrderItems = await Promise.all(
        orderItems.map(async (item) => {
          const meal = await mongoStorage.getMeal(item.mealId);
          return {
            ...item,
            meal
          };
        })
      );
      
      res.json({
        ...order,
        items: enrichedOrderItems
      });
    } catch (err) {
      console.error("Error fetching order:", err);
      res.status(500).json({ message: "Error fetching order" });
    }
  });
  
  // Update an order (for payment status updates)
  app.patch("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const orderId = parseInt(req.params.id);
      const { status, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
      
      // Get the order - use MongoDB directly
      const order = await mongoStorage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Only the order owner can update their own order
      if (order.userId !== userId && (req.user as any).role !== 'admin') {
        return res.status(403).json({ message: "You do not have permission to update this order" });
      }
      
      // Define allowed status transitions
      const allowedTransitions: Record<string, string[]> = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['delivered', 'cancelled'],
        'delivered': [],
        'cancelled': []
      };
      
      // Check if the status transition is allowed
      if (status && order.status !== status) {
        if (!allowedTransitions[order.status].includes(status)) {
          return res.status(400).json({ 
            message: `Cannot transition order from ${order.status} to ${status}` 
          });
        }
      }
      
      // Update order with payment details if provided
      if (status === 'confirmed' && razorpayPaymentId && razorpayOrderId && razorpaySignature) {
        // Verify the payment signature
        const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        
        if (!isValid) {
          return res.status(400).json({ message: "Invalid payment signature" });
        }
        
        // Store the payment details in our in-memory map
        orderPaymentMap.set(orderId, {
          razorpayOrderId,
          razorpayPaymentId,
          status: 'paid'
        });
      }
      
      // Update the order status - use MongoDB directly
      await mongoStorage.updateOrderStatus(orderId, status);
      
      // Get the updated order - use MongoDB directly
      const updatedOrder = await mongoStorage.getOrder(orderId);
      
      res.json(updatedOrder);
    } catch (err) {
      console.error("Error updating order:", err);
      res.status(500).json({ message: "Error updating order" });
    }
  });
  
  // Analytics routes - restricted to admin only
  app.get('/api/analytics', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const dateRange = (req.query.range as AnalyticsDateRange) || '30days';
      
      // Get analytics data
      const analyticsData = await analyticsService.getAnalytics(dateRange);
      
      res.json(analyticsData);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      res.status(500).json({ message: "Error fetching analytics data" });
    }
  });

  // Order Management endpoints (for managers and admins)
  app.get("/api/admin/orders", isAuthenticated, isManagerOrAdmin, async (req, res) => {
    try {
      // Use MongoDB storage implementation directly
      const orders = await mongoStorage.getAllOrders();
      
      // Enrich orders with user information - use MongoDB directly
      const enrichedOrders = await Promise.all(orders.map(async (order) => {
        const user = await mongoStorage.getUser(order.userId);
        return {
          ...order,
          userName: user?.name || "Unknown User"
        };
      }));

      res.json(enrichedOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  app.get("/api/admin/subscriptions", isAuthenticated, isManagerOrAdmin, async (req, res) => {
    try {
      // Use MongoDB storage implementation directly
      const subscriptions = await mongoStorage.getAllSubscriptions();
      
      // Enrich subscriptions with user information - use MongoDB directly
      const enrichedSubscriptions = await Promise.all(subscriptions.map(async (subscription) => {
        const user = await mongoStorage.getUser(subscription.userId);
        return {
          ...subscription,
          userName: user?.name || "Unknown User"
        };
      }));

      res.json(enrichedSubscriptions);
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
      res.status(500).json({ message: "Error fetching subscriptions" });
    }
  });

  app.patch("/api/admin/orders/:id/status", isAuthenticated, isManagerOrAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      if (!['pending', 'confirmed', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Use MongoDB storage implementation directly
      const updatedOrder = await mongoStorage.updateOrderStatus(orderId, status);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (err) {
      console.error("Error updating order status:", err);
      res.status(500).json({ message: "Error updating order status" });
    }
  });

  // Admin Portal endpoints (admin only)
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Use MongoDB storage implementation directly
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
      
      // Check if username or email already exists - use MongoDB directly
      const existingUser = await mongoStorage.getUserByUsername(userData.username) || 
                          await mongoStorage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ 
          message: `User with the same ${existingUser.username === userData.username ? 'username' : 'email'} already exists` 
        });
      }
      
      // Use MongoDB storage implementation directly
      const newUser = await mongoStorage.createUser(userData);
      res.status(201).json(newUser);
    } catch (err) {
      console.error("Error creating user:", err);
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.patch("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      // Use MongoDB storage implementation directly
      const updatedUser = await mongoStorage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Admin Meal Management
  app.get("/api/admin/meals", isAuthenticated, isAdmin, async (req, res) => {
    try {
      console.log("Admin: Fetching all meals from MongoDB...");
      
      // Use MongoDB directly instead of going through storage
      const meals = await MealModel.find().lean();
      
      // Get all curry options from the CurryOption collection
      const globalCurryOptions = await CurryOption.find().lean();
      
      // Enhance each meal with curry options as object format {id, name, priceAdjustment}
      const enhancedMeals = meals.map(meal => {
        // If meal has embedded curry options, use those
        if (meal.curryOptions && meal.curryOptions.length > 0) {
          // If curryOptions is already in object format, just return the meal
          if (typeof meal.curryOptions[0] === 'object' && !Array.isArray(meal.curryOptions[0])) {
            return meal;
          }
          
          // If curryOptions is in array format, convert to object format
          return {
            ...meal,
            curryOptions: meal.curryOptions.map((option: any) => {
              if (Array.isArray(option)) {
                return {
                  id: option[0],
                  name: option[1],
                  priceAdjustment: option[2]
                };
              }
              return option;
            })
          };
        } else {
          // Otherwise use applicable global options
          const mealSpecificOptions = globalCurryOptions.filter((option: any) => 
            option.mealId === null || option.mealId === meal.id
          );
          
          // Use the formatter utility to convert to object format
          return {
            ...meal,
            curryOptions: formatCurryOptions(mealSpecificOptions, meal.id)
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

  app.post("/api/admin/meals", isAuthenticated, isAdmin, async (req, res) => {
    try {
      let mealData = { ...req.body };
      console.log("Admin: Creating new meal in MongoDB...");
      
      // Ensure curry options are in the correct format
      if (mealData.curryOptions && Array.isArray(mealData.curryOptions)) {
        // Convert curry options from object format to array format for storage
        // This ensures backward compatibility with existing code
        mealData.curryOptions = mealData.curryOptions.map((option: any) => {
          if (typeof option === 'object' && !Array.isArray(option) && option.id) {
            return [option.id, option.name, option.priceAdjustment];
          }
          return option;
        });
      }
      
      // Use MongoDB directly instead of going through storage
      const newMeal = await MealModel.create(mealData);
      console.log(`Admin: Created new meal with ID ${newMeal.id}`);
      
      // Return the meal with curry options in object format
      const responseData = {
        ...newMeal.toObject(),
        curryOptions: newMeal.curryOptions ? formatCurryOptions(newMeal.curryOptions, newMeal.id) : []
      };
      
      res.status(201).json(responseData);
    } catch (err) {
      console.error("Error creating meal:", err);
      res.status(500).json({ message: "Error creating meal" });
    }
  });

  app.put("/api/admin/meals/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const mealId = parseInt(req.params.id);
      let mealData = { ...req.body };
      
      console.log(`Admin: Updating meal with ID ${mealId} in MongoDB...`);
      
      // Ensure curry options are in the correct format for storage
      if (mealData.curryOptions && Array.isArray(mealData.curryOptions)) {
        // Convert curry options from object format to array format for storage
        mealData.curryOptions = mealData.curryOptions.map((option: any) => {
          if (typeof option === 'object' && !Array.isArray(option) && option.id) {
            return [option.id, option.name, option.priceAdjustment];
          }
          return option;
        });
      }
      
      // Use MongoDB directly instead of going through storage
      const result = await MealModel.findOneAndUpdate(
        { id: mealId },
        { $set: mealData },
        { new: true } // Return the updated document
      ).lean();
      
      if (!result) {
        console.log(`Admin: Meal with ID ${mealId} not found`);
        return res.status(404).json({ message: "Meal not found" });
      }
      
      // Get all curry options from the CurryOption collection for formatting
      const globalCurryOptions = await CurryOption.find().lean();
      
      // Format the response with curry options in object format
      const formattedResult = {
        ...result,
        curryOptions: result.curryOptions && result.curryOptions.length > 0 
          ? formatCurryOptions(result.curryOptions, mealId) 
          : formatCurryOptions(globalCurryOptions.filter((option: any) => {
              // Check if this curry option applies to this meal either through:
              // 1. Legacy mealId field, or
              // 2. New mealIds array containing this meal's ID
              const legacyMatch = option.mealId === null || option.mealId === mealId;
              const arrayMatch = Array.isArray(option.mealIds) && option.mealIds.includes(mealId);
              return legacyMatch || arrayMatch;
            }), mealId)
      };
      
      console.log(`Admin: Successfully updated meal with ID ${mealId}`);
      res.json(formattedResult);
    } catch (err) {
      console.error("Error updating meal:", err);
      res.status(500).json({ message: "Error updating meal" });
    }
  });
  
  // Admin route to update or add a curry option for a meal
  app.post("/api/admin/meals/:id/curry-options", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const mealId = parseInt(req.params.id);
      const curryOptionData = req.body;
      
      console.log(`Admin: Creating/updating curry option for meal ID ${mealId}`);
      
      // Check if the meal exists
      const meal = await MealModel.findOne({ id: mealId }).lean();
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      // Generate an ID if not provided (new curry option)
      if (!curryOptionData.id) {
        curryOptionData.id = `curry_${Date.now()}`;
        curryOptionData.createdAt = new Date();
      }
      
      // Set necessary properties
      // Instead of single mealId, use mealIds array for multiple meal associations
      if (!curryOptionData.mealIds) {
        curryOptionData.mealIds = [mealId]; // Add current meal to mealIds array
      } else if (Array.isArray(curryOptionData.mealIds) && !curryOptionData.mealIds.includes(mealId)) {
        curryOptionData.mealIds.push(mealId); // Add current meal to existing array if not already included
      }
      
      // Keep mealId for backward compatibility
      curryOptionData.mealId = mealId;
      curryOptionData.updatedAt = new Date();
      
      // Save the curry option - create or update
      let curryOption;
      if (curryOptionData.id) {
        // Try to find existing curry option
        const existingOption = await CurryOption.findOne({ id: curryOptionData.id });
        
        if (existingOption) {
          // Update existing curry option
          curryOption = await CurryOption.findOneAndUpdate(
            { id: curryOptionData.id },
            { $set: curryOptionData },
            { new: true }
          );
        } else {
          // Create new curry option
          curryOption = await CurryOption.create(curryOptionData);
        }
      } else {
        // Create new curry option
        curryOption = await CurryOption.create(curryOptionData);
      }
      
      if (!curryOption) {
        throw new Error(`Failed to create or update curry option`);
      }
      
      console.log(`Admin: Successfully created/updated curry option with ID ${curryOption.id}`);
      
      // Return the updated meal with all curry options
      const globalCurryOptions = await CurryOption.find().lean();
      const mealSpecificOptions = globalCurryOptions.filter((option: any) => 
        option.mealId === null || option.mealId === mealId
      );
      
      // Format the response with curry options in object format
      const formattedOptions = formatCurryOptions(mealSpecificOptions, mealId);
      
      res.status(201).json({
        message: "Curry option created/updated successfully",
        curryOption,
        allCurryOptions: formattedOptions
      });
    } catch (error) {
      console.error("Error creating/updating curry option:", error);
      res.status(500).json({ message: "Failed to create/update curry option" });
    }
  });
  
  // Admin route to get all curry options for a meal
  app.get("/api/admin/meals/:id/curry-options", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const mealId = parseInt(req.params.id);
      
      // Check if the meal exists
      const meal = await MealModel.findOne({ id: mealId }).lean();
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      // Get all curry options from the CurryOption collection
      const globalCurryOptions = await CurryOption.find().lean();
      
      // Filter options for this meal (either meal-specific or global)
      const mealSpecificOptions = globalCurryOptions.filter((option: any) => 
        option.mealId === null || option.mealId === mealId
      );
      
      // Format the response with curry options in object format
      const formattedOptions = formatCurryOptions(mealSpecificOptions, mealId);
      
      res.json(formattedOptions);
    } catch (error) {
      console.error("Error fetching curry options for meal:", error);
      res.status(500).json({ message: "Failed to fetch curry options" });
    }
  });
  
  // Admin route to delete a curry option
  app.delete("/api/admin/meals/:mealId/curry-options/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const mealId = parseInt(req.params.mealId);
      const curryOptionId = req.params.id;
      
      // Check if the curry option exists
      const curryOption = await CurryOption.findOne({ id: curryOptionId });
      if (!curryOption) {
        return res.status(404).json({ message: "Curry option not found" });
      }
      
      // Delete the curry option
      await CurryOption.deleteOne({ id: curryOptionId });
      
      // Get all curry options for this meal
      const globalCurryOptions = await CurryOption.find().lean();
      const mealSpecificOptions = globalCurryOptions.filter((option: any) => 
        option.mealId === null || option.mealId === mealId
      );
      
      // Format the response with curry options in object format
      const formattedOptions = formatCurryOptions(mealSpecificOptions, mealId);
      
      res.json({
        message: "Curry option deleted successfully",
        allCurryOptions: formattedOptions
      });
    } catch (error) {
      console.error("Error deleting curry option:", error);
      res.status(500).json({ message: "Failed to delete curry option" });
    }
  });
  
  // Admin route to update meal prices (divide by 100)
  app.post("/api/admin/update-prices", isAuthenticated, isAdmin, async (req, res) => {
    try {
      console.log('Starting price update process...');
      const meals = await MealModel.find({});
      console.log(`Found ${meals.length} meals to update`);
      
      const updates = [];
      for (const meal of meals) {
        const oldPrice = meal.price;
        const newPrice = Math.round(oldPrice / 100);
        console.log(`Updating meal '${meal.name}': ${oldPrice} -> ${newPrice}`);
        
        meal.price = newPrice;
        updates.push(meal.save());
      }
      
      await Promise.all(updates);
      console.log('Price update completed successfully!');
      
      res.json({ 
        success: true, 
        message: `Updated prices for ${meals.length} meals` 
      });
    } catch (err) {
      console.error("Error updating meal prices:", err);
      res.status(500).json({ message: "Error updating meal prices" });
    }
  });

  // Razorpay payment routes
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
      
      // Verify based on payment type
      if (type === "subscription") {
        // Get the subscription to verify it exists and belongs to the user
        const subscription = await storage.getSubscription(orderId);
        
        if (!subscription) {
          return res.status(404).json({ message: "Subscription not found" });
        }
        
        if (subscription.userId !== userId) {
          return res.status(403).json({ message: "You do not have permission to pay for this subscription" });
        }
        
        entity = subscription;
        entityType = "subscription";
      } else {
        // Get the order to verify it exists and belongs to the user
        const order = await storage.getOrder(orderId);
        
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
        
        if (order.userId !== userId) {
          return res.status(403).json({ message: "You do not have permission to pay for this order" });
        }
        
        entity = order;
      }
      
      // Create a Razorpay order
      const razorpayOrder = await createOrder({
        amount,
        receipt: `${entityType}_${orderId}`,
        notes: {
          entityType,
          entityId: orderId.toString(),
          userId: userId.toString(),
          ...notes
        }
      });
      
      // Store the Razorpay order ID appropriately
      if (entityType === "subscription") {
        subscriptionPaymentMap.set(orderId, {
          razorpaySubscriptionId: razorpayOrder.id,
          status: 'created'
        });
      } else {
        orderPaymentMap.set(orderId, {
          razorpayOrderId: razorpayOrder.id,
          status: 'created'
        });
      }
      
      res.json({
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        key: process.env.RAZORPAY_KEY_ID
      });
    } catch (err) {
      console.error("Error creating Razorpay order:", err);
      res.status(500).json({ message: "Error creating payment order" });
    }
  });
  
  // Handle successful payment
  app.post("/api/payments/verify", isAuthenticated, async (req, res) => {
    try {
      const { 
        orderId, 
        razorpayOrderId, 
        razorpayPaymentId, 
        razorpaySignature,
        type = "order"
      } = req.body;
      
      if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ message: "Missing required payment verification details" });
      }
      
      // Verify payment
      const result = await handlePaymentSuccess(
        parseInt(orderId),
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        type as 'order' | 'subscription'
      );
      
      res.json(result);
    } catch (err: any) {
      console.error("Error verifying payment:", err);
      res.status(400).json({ message: err.message || "Payment verification failed" });
    }
  });
  
  // Handle failed payment
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
  
  // Razorpay webhook
  app.post("/api/webhook/razorpay", async (req, res) => {
    try {
      // Get the signature from headers
      const signature = req.headers['x-razorpay-signature'] as string;
      
      if (!signature) {
        return res.status(400).json({ message: "Missing Razorpay signature" });
      }
      
      // Process the webhook
      const result = await handleWebhookEvent(req.body, signature);
      res.json(result);
    } catch (err: any) {
      console.error("Error processing Razorpay webhook:", err);
      res.status(400).json({ message: err.message || "Webhook processing failed" });
    }
  });

  // Curry Option API Routes
  
  // === Regular curry options API routes ===
  // Get all curry options
  app.get("/api/curry-options", async (req, res) => {
    try {
      const curryOptions = await storage.getCurryOptions();
      res.json(curryOptions);
    } catch (error) {
      console.error("Error fetching curry options:", error);
      res.status(500).json({ message: "Failed to fetch curry options" });
    }
  });
  
  // Get a specific curry option by ID
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
  
  // === Admin curry options API routes ===
  // Get all curry options (admin)
  app.get("/api/admin/curry-options", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const curryOptions = await storage.getCurryOptions();
      res.json(curryOptions);
    } catch (error) {
      console.error("Error fetching curry options:", error);
      res.status(500).json({ message: "Failed to fetch curry options" });
    }
  });
  
  // Create a new curry option (admin)
  app.post("/api/admin/curry-options", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Ensure mealIds is an array of numbers
      let mealIds = req.body.mealIds || [];
      if (mealIds && Array.isArray(mealIds)) {
        // Convert string IDs to numbers if needed
        mealIds = mealIds.map(id => typeof id === 'string' ? parseInt(id) : id);
      }
      
      const curryOptionData = {
        id: req.body.id || `curry_${Date.now()}`,
        name: req.body.name,
        description: req.body.description || "",
        priceAdjustment: parseFloat(req.body.priceAdjustment) || 0,
        mealIds: mealIds,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const newCurryOption = await storage.createCurryOption(curryOptionData);
      res.status(201).json(newCurryOption);
    } catch (error) {
      console.error("Error creating curry option:", error);
      res.status(500).json({ message: "Failed to create curry option" });
    }
  });
  
  // Update a curry option (admin)
  app.put("/api/admin/curry-options/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      
      if (!id || id === "undefined") {
        return res.status(400).json({ message: "Invalid curry option ID" });
      }
      
      // Ensure mealIds is an array of numbers
      let mealIds = req.body.mealIds || [];
      if (mealIds && Array.isArray(mealIds)) {
        // Convert string IDs to numbers if needed
        mealIds = mealIds.map(id => typeof id === 'string' ? parseInt(id) : id);
      }
      
      const updateData = {
        ...req.body,
        mealIds,
        updatedAt: new Date()
      };
      
      const updatedCurryOption = await storage.updateCurryOption(id, updateData);
      
      if (!updatedCurryOption) {
        return res.status(404).json({ message: "Curry option not found" });
      }
      
      res.json(updatedCurryOption);
    } catch (error) {
      console.error("Error updating curry option:", error);
      res.status(500).json({ message: "Failed to update curry option" });
    }
  });
  
  // Delete a curry option (admin)
  app.delete("/api/admin/curry-options/:id", isAuthenticated, isAdmin, async (req, res) => {
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
  });
  
  // Get curry options for a specific meal
  app.get("/api/meals/:mealId/curry-options", async (req, res) => {
    try {
      const mealId = parseInt(req.params.mealId);
      if (isNaN(mealId)) {
        return res.status(400).json({ message: "Invalid meal ID" });
      }
      
      // Get all curry options and filter by meal ID
      const allCurryOptions = await storage.getCurryOptions();
      const mealCurryOptions = allCurryOptions.filter(option => 
        option.mealId === mealId || option.mealId === null
      );
      
      res.json(mealCurryOptions);
    } catch (error) {
      console.error("Error fetching meal curry options:", error);
      res.status(500).json({ message: "Failed to fetch meal curry options" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}