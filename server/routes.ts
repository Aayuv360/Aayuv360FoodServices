import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { z } from "zod";
import { mealPlannerService } from "./mealPlanner";
import { analyticsService, AnalyticsDateRange } from "./analytics";
import { 
  insertUserSchema, 
  insertCartItemSchema, 
  insertOrderSchema,
  insertOrderItemSchema, 
  insertSubscriptionSchema,
  insertUserPreferencesSchema, 
  insertReviewSchema,
  insertCustomMealPlanSchema,
  Meal,
  CartItem
} from "@shared/schema";

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

const SESSION_SECRET = process.env.SESSION_SECRET || "millet-meal-service-secret";
const MemoryStoreInstance = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreInstance({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Middleware that bypasses authentication (removed protection)
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    // Always allow access without authentication
    // Add a default user for routes that need a user object
    if (!req.isAuthenticated()) {
      (req as any).user = {
        id: 1,
        username: 'guest',
        name: 'Guest User',
        email: 'guest@example.com',
        role: 'user',
        createdAt: new Date()
      };
    }
    return next();
  };

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", isAuthenticated, (req, res) => {
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });
  
  // Meal routes
  app.get("/api/meals", async (req, res) => {
    try {
      const { query, type, preference } = req.query;
      
      let meals = await storage.getAllMeals();
      
      // Filter by search query if provided
      if (query && typeof query === 'string') {
        const searchQuery = query.toLowerCase();
        meals = meals.filter(meal => 
          meal.name.toLowerCase().includes(searchQuery) || 
          meal.description.toLowerCase().includes(searchQuery)
        );
      }
      
      // Filter by meal type if provided
      if (type && typeof type === 'string') {
        meals = meals.filter(meal => meal.mealType === type);
      }
      
      // Filter by dietary preference if provided
      if (preference && typeof preference === 'string') {
        meals = meals.filter(meal => 
          meal.dietaryPreferences && 
          meal.dietaryPreferences.includes(preference as any)
        );
      }
      
      res.json(meals);
    } catch (err) {
      res.status(500).json({ message: "Error fetching meals" });
    }
  });
  
  app.get("/api/meals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const meal = await storage.getMeal(id);
      
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      res.json(meal);
    } catch (err) {
      res.status(500).json({ message: "Error fetching meal" });
    }
  });
  
  app.get("/api/meals/type/:type", async (req, res) => {
    try {
      const meals = await storage.getMealsByType(req.params.type);
      res.json(meals);
    } catch (err) {
      res.status(500).json({ message: "Error fetching meals by type" });
    }
  });
  
  app.get("/api/meals/preference/:preference", async (req, res) => {
    try {
      const meals = await storage.getMealsByDietaryPreference(req.params.preference);
      res.json(meals);
    } catch (err) {
      res.status(500).json({ message: "Error fetching meals by preference" });
    }
  });
  
  // Cart routes
  app.get("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const cartItems = await storage.getCartItems(userId);
      
      // Fetch meal details for each cart item
      const itemsWithDetails = await Promise.all(
        cartItems.map(async (item) => {
          const meal = await storage.getMeal(item.mealId);
          
          // If the cart item has curry option details, add them to the meal
          let mealWithOptions = { ...meal };
          
          if (item.curryOptionId) {
            mealWithOptions = {
              ...meal,
              // Add the curry option to the meal
              curryOption: {
                id: item.curryOptionId,
                name: item.curryOptionName,
                priceAdjustment: item.curryOptionPrice
              },
              // If the curry option has a price adjustment, add it to the meal price
              ...(item.curryOptionPrice && { 
                price: meal.price + item.curryOptionPrice 
              })
            };
          }
          
          return {
            ...item,
            meal: mealWithOptions,
          };
        })
      );
      
      res.json(itemsWithDetails);
    } catch (err) {
      console.error("Error fetching cart:", err);
      res.status(500).json({ message: "Error fetching cart items" });
    }
  });
  
  app.post("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Extract curry option data and notes if present
      const { curryOption, notes, ...restBody } = req.body;
      
      // Get the meal to extract its category
      const meal = await storage.getMeal(restBody.mealId);
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      // Determine the category (use milletType if available, or mealType as fallback)
      const category = meal.milletType || meal.mealType || null;
      
      // Prepare cart item data with curry option info, notes, and category
      const cartItemData = insertCartItemSchema.parse({
        ...restBody,
        userId,
        curryOptionId: curryOption?.id,
        curryOptionName: curryOption?.name,
        curryOptionPrice: curryOption?.priceAdjustment,
        notes: notes || null,
        category
      });
      
      const cartItem = await storage.addToCart(cartItemData);
      
      // When returning the cart item, reconstruct the curryOption object
      const responseItem = {
        ...cartItem,
        meal: {
          ...meal,
          // Add curry option to meal if curry option data exists
          ...(cartItem.curryOptionId && {
            curryOption: {
              id: cartItem.curryOptionId,
              name: cartItem.curryOptionName,
              priceAdjustment: cartItem.curryOptionPrice
            }
          })
        }
      };
      
      res.status(201).json(responseItem);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Cart error:", err);
        res.status(500).json({ message: "Error adding item to cart" });
      }
    }
  });
  
  app.put("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quantity = z.number().min(1).parse(req.body.quantity);
      
      const cartItem = await storage.updateCartItemQuantity(id, quantity);
      
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      const meal = await storage.getMeal(cartItem.mealId);
      
      // If the cart item has curry option details, add them to the meal
      let mealWithOptions = { ...meal };
      
      if (cartItem.curryOptionId) {
        mealWithOptions = {
          ...meal,
          // Add the curry option to the meal
          curryOption: {
            id: cartItem.curryOptionId,
            name: cartItem.curryOptionName,
            priceAdjustment: cartItem.curryOptionPrice
          },
          // If the curry option has a price adjustment, add it to the meal price
          ...(cartItem.curryOptionPrice && { 
            price: meal.price + cartItem.curryOptionPrice 
          })
        };
      }
      
      res.json({
        ...cartItem,
        meal: mealWithOptions,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Error updating cart item:", err);
        res.status(500).json({ message: "Error updating cart item" });
      }
    }
  });
  
  // Endpoint to update cart item with curry options, notes, and other details
  app.patch("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Validate the update payload
      const updateSchema = z.object({
        quantity: z.number().min(1).optional(),
        curryOptionId: z.string().nullable().optional(),
        curryOptionName: z.string().nullable().optional(),
        curryOptionPrice: z.number().nullable().optional(),
        notes: z.string().nullable().optional(),
      });
      
      const validUpdates = updateSchema.parse(updates);
      
      const cartItem = await storage.updateCartItem(id, validUpdates);
      
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      const meal = await storage.getMeal(cartItem.mealId);
      
      // If the cart item has curry option details, add them to the meal
      let mealWithOptions = { ...meal };
      
      if (cartItem.curryOptionId) {
        mealWithOptions = {
          ...meal,
          // Add the curry option to the meal
          curryOption: {
            id: cartItem.curryOptionId,
            name: cartItem.curryOptionName,
            priceAdjustment: cartItem.curryOptionPrice
          },
          // If the curry option has a price adjustment, add it to the meal price
          ...(cartItem.curryOptionPrice && { 
            price: meal.price + cartItem.curryOptionPrice 
          })
        };
      }
      
      res.json({
        ...cartItem,
        meal: mealWithOptions,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Error updating cart item:", err);
        res.status(500).json({ message: "Error updating cart item" });
      }
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.removeFromCart(id);
      
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json({ message: "Cart item removed successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error removing cart item" });
    }
  });
  
  app.delete("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error clearing cart" });
    }
  });
  
  // Endpoint to clear cart items by category (millet type or meal type)
  app.delete("/api/cart/category/:category", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const category = req.params.category;
      
      // Get all cart items
      const cartItems = await storage.getCartItems(userId);
      
      // Filter items by the requested category
      const itemsToRemove = cartItems.filter(item => item.category === category);
      
      if (itemsToRemove.length === 0) {
        return res.status(404).json({ message: "No items found in this category" });
      }
      
      // Remove each item in the category
      await Promise.all(itemsToRemove.map(item => storage.removeFromCart(item.id)));
      
      res.json({ 
        message: `${itemsToRemove.length} items in category '${category}' removed successfully`,
        removedCount: itemsToRemove.length
      });
    } catch (err) {
      console.error("Error clearing cart category:", err);
      res.status(500).json({ message: "Error clearing items by category" });
    }
  });
  
  // Order routes
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const orders = await storage.getOrdersByUserId(userId);
      
      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          
          // Fetch meal details for each order item
          const itemsWithDetails = await Promise.all(
            items.map(async (item) => {
              const meal = await storage.getMeal(item.mealId);
              return {
                ...item,
                meal,
              };
            })
          );
          
          return {
            ...order,
            items: itemsWithDetails,
          };
        })
      );
      
      res.json(ordersWithItems);
    } catch (err) {
      res.status(500).json({ message: "Error fetching orders" });
    }
  });
  
  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if order belongs to the authenticated user
      if (order.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const items = await storage.getOrderItems(order.id);
      
      // Fetch meal details for each order item
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const meal = await storage.getMeal(item.mealId);
          return {
            ...item,
            meal,
          };
        })
      );
      
      res.json({
        ...order,
        items: itemsWithDetails,
      });
    } catch (err) {
      res.status(500).json({ message: "Error fetching order" });
    }
  });
  
  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Convert string deliveryTime to Date object if needed
      let requestData = { ...req.body, userId };
      if (requestData.deliveryTime && typeof requestData.deliveryTime === 'string') {
        requestData.deliveryTime = new Date(requestData.deliveryTime);
      }
      
      const orderData = insertOrderSchema.parse(requestData);
      
      const order = await storage.createOrder(orderData);
      
      // Create order items from cart
      const cartItems = await storage.getCartItems(userId);
      
      const orderItems = await Promise.all(
        cartItems.map(async (item) => {
          const meal = await storage.getMeal(item.mealId);
          
          if (!meal) {
            throw new Error(`Meal with id ${item.mealId} not found`);
          }
          
          // Cast item to CartItemWithMeal to handle the meal property correctly
          const cartItem = item as unknown as CartItemWithMeal;
          
          // Get meal from cart item if available, otherwise use the meal from storage
          const mealData = cartItem.meal || meal;
          
          // Check if the meal in cart has curry options (using optional chaining)
          const mealPrice = mealData.price || meal.price;
          const hasCurryOption = mealData.curryOption !== undefined;
          
          const orderItemData = {
            orderId: order.id,
            mealId: item.mealId,
            quantity: item.quantity,
            price: mealPrice,
            // Store curry option details in the notes field
            notes: hasCurryOption ? 
              JSON.stringify({
                curryOption: mealData.curryOption,
                originalName: mealData.originalName || meal.name
              }) : 
              undefined
          };
          
          return storage.createOrderItem(orderItemData);
        })
      );
      
      // Clear the cart after creating the order
      await storage.clearCart(userId);
      
      // Fetch meal details for each order item
      const itemsWithDetails = await Promise.all(
        orderItems.map(async (item) => {
          const meal = await storage.getMeal(item.mealId);
          return {
            ...item,
            meal,
          };
        })
      );
      
      res.status(201).json({
        ...order,
        items: itemsWithDetails,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
        res.status(500).json({ message: "Error creating order" });
      }
    }
  });
  
  // Subscription routes
  app.get("/api/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const subscriptions = await storage.getSubscriptionsByUserId(userId);
      res.json(subscriptions);
    } catch (err) {
      res.status(500).json({ message: "Error fetching subscriptions" });
    }
  });
  
  app.post("/api/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Parse the startDate string to a Date object if it's a string
      let requestData = { ...req.body, userId };
      if (requestData.startDate && typeof requestData.startDate === 'string') {
        requestData.startDate = new Date(requestData.startDate);
      }
      
      const subscriptionData = insertSubscriptionSchema.parse(requestData);
      
      const subscription = await storage.createSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Subscription error:", err);
        res.status(500).json({ message: "Error creating subscription" });
      }
    }
  });
  
  app.put("/api/subscriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Check if subscription belongs to the authenticated user
      if (subscription.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedSubscription = await storage.updateSubscription(id, req.body);
      res.json(updatedSubscription);
    } catch (err) {
      res.status(500).json({ message: "Error updating subscription" });
    }
  });
  
  // Custom Meal Plan routes
  app.get("/api/custom-meal-plans/:subscriptionId", isAuthenticated, async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.subscriptionId);
      const subscription = await storage.getSubscription(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Check if subscription belongs to the authenticated user
      if (subscription.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const customMealPlans = await storage.getCustomMealPlans(subscriptionId);
      
      // Fetch meal details for each custom meal plan
      const plansWithMealDetails = await Promise.all(
        customMealPlans.map(async (plan) => {
          const meal = await storage.getMeal(plan.mealId);
          return {
            ...plan,
            meal,
          };
        })
      );
      
      res.json(plansWithMealDetails);
    } catch (err) {
      res.status(500).json({ message: "Error fetching custom meal plans" });
    }
  });
  
  app.post("/api/custom-meal-plans", isAuthenticated, async (req, res) => {
    try {
      const customMealPlanData = insertCustomMealPlanSchema.parse(req.body);
      
      // Verify subscription exists and belongs to user
      const subscription = await storage.getSubscription(customMealPlanData.subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      if (subscription.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Verify meal exists
      const meal = await storage.getMeal(customMealPlanData.mealId);
      
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      const customMealPlan = await storage.createCustomMealPlan(customMealPlanData);
      
      res.status(201).json({
        ...customMealPlan,
        meal,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
        res.status(500).json({ message: "Error creating custom meal plan" });
      }
    }
  });
  
  app.delete("/api/custom-meal-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Fetch all custom meal plans and find the one we need
      const allCustomMealPlans = await storage.getCustomMealPlans(0); // Passing 0 as a dummy value
      const customMealPlan = allCustomMealPlans.find(plan => plan.id === id);
      
      if (!customMealPlan) {
        return res.status(404).json({ message: "Custom meal plan not found" });
      }
      
      // Verify subscription belongs to user
      const subscription = await storage.getSubscription(customMealPlan.subscriptionId);
      
      if (!subscription || subscription.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.deleteCustomMealPlan(id);
      
      if (!success) {
        return res.status(404).json({ message: "Custom meal plan not found" });
      }
      
      res.json({ message: "Custom meal plan deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting custom meal plan" });
    }
  });
  
  // User preferences routes
  app.get("/api/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        return res.status(404).json({ message: "Preferences not found" });
      }
      
      res.json(preferences);
    } catch (err) {
      res.status(500).json({ message: "Error fetching preferences" });
    }
  });
  
  app.post("/api/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Check if preferences already exist
      const existingPreferences = await storage.getUserPreferences(userId);
      
      if (existingPreferences) {
        const updatedPreferences = await storage.updateUserPreferences(userId, req.body);
        return res.json(updatedPreferences);
      }
      
      const preferencesData = insertUserPreferencesSchema.parse({
        ...req.body,
        userId,
      });
      
      const preferences = await storage.createUserPreferences(preferencesData);
      res.status(201).json(preferences);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
        res.status(500).json({ message: "Error creating preferences" });
      }
    }
  });
  
  // Review routes
  app.get("/api/reviews/meal/:mealId", async (req, res) => {
    try {
      const mealId = parseInt(req.params.mealId);
      const reviews = await storage.getReviewsByMealId(mealId);
      res.json(reviews);
    } catch (err) {
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });
  
  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId,
      });
      
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
        res.status(500).json({ message: "Error creating review" });
      }
    }
  });
  
  // User profile routes
  app.put("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Error updating profile" });
    }
  });

  // Meal planner routes
  app.get("/api/meal-plan", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const startDateStr = req.query.startDate as string;
      const endDateStr = req.query.endDate as string;
      
      if (!startDateStr) {
        return res.status(400).json({ message: "Start date is required" });
      }
      
      const startDate = new Date(startDateStr);
      let endDate: Date;
      
      if (endDateStr) {
        endDate = new Date(endDateStr);
      } else {
        // Default to 7 days from start date
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
      }
      
      const mealPlan = await mealPlannerService.getUserMealPlan(userId, startDate, endDate);
      res.json(mealPlan);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Error fetching meal plan" });
    }
  });
  
  app.get("/api/meal-recommendations", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const count = req.query.count ? parseInt(req.query.count as string) : 5;
      
      const recommendations = await mealPlannerService.getMealRecommendations(userId, count);
      res.json(recommendations);
    } catch (err) {
      res.status(500).json({ message: "Error fetching meal recommendations" });
    }
  });
  
  app.get("/api/weekly-meal-plans", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const startDateStr = req.query.startDate as string;
      const weeksStr = req.query.weeks as string;
      
      const startDate = startDateStr ? new Date(startDateStr) : new Date();
      const weeks = weeksStr ? parseInt(weeksStr) : 4;
      
      const weeklyPlans = await mealPlannerService.generateWeeklyMealPlans(
        startDate,
        weeks,
        userId
      );
      
      res.json(weeklyPlans);
    } catch (err) {
      res.status(500).json({ message: "Error generating weekly meal plans" });
    }
  });
  
  // Location API
  app.get("/api/locations", async (req, res) => {
    try {
      const { query, lat, lng, radius = 10 } = req.query; // radius in km
      
      const defaultLocations = [
        { id: 1, name: "Hyderabad, Gachibowli", pincode: "500032", lat: 17.4401, lng: 78.3489, available: true },
        { id: 2, name: "Hyderabad, Madhapur", pincode: "500081", lat: 17.4486, lng: 78.3908, available: true },
        { id: 3, name: "Hyderabad, Hitech City", pincode: "500084", lat: 17.4435, lng: 78.3772, available: true },
        { id: 4, name: "Hyderabad, Jubilee Hills", pincode: "500033", lat: 17.4275, lng: 78.4069, available: true },
        { id: 5, name: "Hyderabad, Banjara Hills", pincode: "500034", lat: 17.4138, lng: 78.4369, available: true },
        { id: 6, name: "Hyderabad, Secunderabad", pincode: "500003", lat: 17.4399, lng: 78.4983, available: false },
        { id: 7, name: "Hyderabad, Kukatpally", pincode: "500072", lat: 17.4849, lng: 78.4138, available: true },
        { id: 8, name: "Hyderabad, Ameerpet", pincode: "500016", lat: 17.4374, lng: 78.4487, available: true },
        { id: 9, name: "Hyderabad, Kokapet", pincode: "500075", lat: 17.3889, lng: 78.3315, available: true },
        { id: 10, name: "Hyderabad, Kondapur", pincode: "500084", lat: 17.4606, lng: 78.3664, available: true },
        { id: 11, name: "Hyderabad, Miyapur", pincode: "500049", lat: 17.4979, lng: 78.3595, available: false },
        { id: 12, name: "Hyderabad, Manikonda", pincode: "500089", lat: 17.4005, lng: 78.3752, available: true }
      ];
      
      let filteredLocations = [...defaultLocations];
      
      // Filter by search query if provided
      if (query && typeof query === 'string') {
        const searchQuery = query.toLowerCase();
        filteredLocations = filteredLocations.filter(location => 
          location.name.toLowerCase().includes(searchQuery) || 
          location.pincode.includes(searchQuery)
        );
      }
      
      // Filter by coordinates and radius if provided
      if (lat && lng && typeof lat === 'string' && typeof lng === 'string') {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const radiusKm = typeof radius === 'string' ? parseFloat(radius) : 10;
        
        // Only include locations within the specified radius
        filteredLocations = filteredLocations.filter(location => {
          // Calculate distance using Haversine formula
          const R = 6371; // Earth radius in km
          const dLat = (location.lat - userLat) * Math.PI / 180;
          const dLon = (location.lng - userLng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c; // Distance in km
          
          return distance <= radiusKm;
        });
      }
      
      // Only return available locations
      filteredLocations = filteredLocations.filter(location => location.available);
      
      res.json(filteredLocations);
    } catch (err) {
      res.status(500).json({ message: "Error fetching locations" });
    }
  });
  
  // Direct payment routes (replaced Stripe)
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount, planId } = req.body;
      
      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }
      
      // Calculate tax (5%)
      const taxAmount = Math.round(amount * 0.05); 
      const totalAmount = amount + taxAmount;
      
      // Construct order details
      const orderDetails = {
        amount,
        tax: taxAmount,
        total: totalAmount,
      };
      
      if (planId) {
        // If it's a subscription, add the plan details
        const plans = await storage.getSubscription(parseInt(planId));
        if (plans) {
          (orderDetails as any).planName = plans.plan;
        }
      }
      
      // Create a new order with the data we have
      const orderData: {
        userId: number;
        totalPrice: number;
        deliveryAddress: string;
        deliveryTime?: Date;
      } = {
        userId: (req.user as any).id,
        totalPrice: totalAmount,
        deliveryAddress: req.body.address || ''
      };
      
      // Add delivery time (optional in schema)
      if (req.body.deliveryTime) {
        orderData.deliveryTime = new Date(req.body.deliveryTime);
      } else {
        orderData.deliveryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Delivery tomorrow
      }
      
      const order = await storage.createOrder(orderData);
      
      // Update order status to confirmed
      await storage.updateOrderStatus(order.id, 'confirmed');
      
      res.json({
        success: true,
        order,
        orderDetails,
      });
    } catch (error: any) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Analytics routes
  app.get("/api/analytics", isAuthenticated, async (req, res) => {
    try {
      // Check if user is an admin
      const user = req.user as any;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      // Get date range from query parameter, default to 30 days
      const dateRange = (req.query.range as AnalyticsDateRange) || '30days';
      
      // Validate the date range
      if (!['7days', '30days', '90days', 'year'].includes(dateRange)) {
        return res.status(400).json({ message: "Invalid date range. Must be one of: 7days, 30days, 90days, year" });
      }
      
      // Get analytics data
      const analyticsData = await analyticsService.getAnalytics(dateRange);
      
      res.json(analyticsData);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      res.status(500).json({ message: "Error fetching analytics data" });
    }
  });

  // Admin and Manager routes
  const isAdminOrManager = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = req.user as any;
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ message: "Access denied. Admin or Manager role required." });
    }
    
    next();
  };

  // Admin-only routes
  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = req.user as any;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }
    
    next();
  };

  // Order Management endpoints (for managers and admins)
  app.get("/api/admin/orders", isAdminOrManager, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      
      // Enrich orders with user information
      const enrichedOrders = await Promise.all(orders.map(async (order) => {
        const user = await storage.getUser(order.userId);
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

  app.get("/api/admin/subscriptions", isAdminOrManager, async (req, res) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      
      // Enrich subscriptions with user information
      const enrichedSubscriptions = await Promise.all(subscriptions.map(async (subscription) => {
        const user = await storage.getUser(subscription.userId);
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

  app.patch("/api/admin/orders/:id/status", isAdminOrManager, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      if (!['pending', 'confirmed', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      
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
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.post("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const userData = req.body;
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(userData.username) || 
                          await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ 
          message: `User with the same ${existingUser.username === userData.username ? 'username' : 'email'} already exists` 
        });
      }
      
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (err) {
      console.error("Error creating user:", err);
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ message: "Error updating user" });
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // In a real application, you would implement proper user deletion
      // For this demo, we'll just return a success message
      res.json({ message: "User deleted successfully" });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  app.get("/api/admin/meals", isAdmin, async (req, res) => {
    try {
      const meals = await storage.getAllMeals();
      res.json(meals);
    } catch (err) {
      console.error("Error fetching meals:", err);
      res.status(500).json({ message: "Error fetching meals" });
    }
  });

  app.post("/api/admin/meals", isAdmin, async (req, res) => {
    try {
      const mealData = req.body;
      const newMeal = await storage.createMeal(mealData);
      res.status(201).json(newMeal);
    } catch (err) {
      console.error("Error creating meal:", err);
      res.status(500).json({ message: "Error creating meal" });
    }
  });

  app.patch("/api/admin/meals/:id", isAdmin, async (req, res) => {
    try {
      const mealId = parseInt(req.params.id);
      const mealData = req.body;
      
      const updatedMeal = await storage.updateMeal(mealId, mealData);
      
      if (!updatedMeal) {
        return res.status(404).json({ message: "Meal not found" });
      }
      
      res.json(updatedMeal);
    } catch (err) {
      console.error("Error updating meal:", err);
      res.status(500).json({ message: "Error updating meal" });
    }
  });

  app.delete("/api/admin/meals/:id", isAdmin, async (req, res) => {
    try {
      const mealId = parseInt(req.params.id);
      
      // In a real application, you would implement proper meal deletion
      // For this demo, we'll just return a success message
      res.json({ message: "Meal deleted successfully" });
    } catch (err) {
      console.error("Error deleting meal:", err);
      res.status(500).json({ message: "Error deleting meal" });
    }
  });

  // Curry options endpoints
  app.get("/api/admin/curry-options", isAdmin, async (req, res) => {
    try {
      // For demo purposes, we'll return a static list of curry options
      // In a real application, you would fetch these from the database
      const curryOptions = [
        { id: "regular", name: "Regular Curry", priceAdjustment: 0, description: "Traditional medium-spicy curry" },
        { id: "spicy", name: "Spicy Curry", priceAdjustment: 20, description: "Extra spicy curry with additional chilies" },
        { id: "mild", name: "Mild Curry", priceAdjustment: 0, description: "Mild curry suitable for those who prefer less spice" },
        { id: "creamy", name: "Creamy Curry", priceAdjustment: 40, description: "Rich and creamy curry with coconut milk" }
      ];
      
      res.json(curryOptions);
    } catch (err) {
      console.error("Error fetching curry options:", err);
      res.status(500).json({ message: "Error fetching curry options" });
    }
  });

  app.post("/api/admin/curry-options", isAdmin, async (req, res) => {
    try {
      const curryData = req.body;
      
      // In a real application, you would save this to the database
      // For this demo, we'll just return the data as if it was saved
      res.status(201).json(curryData);
    } catch (err) {
      console.error("Error creating curry option:", err);
      res.status(500).json({ message: "Error creating curry option" });
    }
  });

  app.patch("/api/admin/curry-options/:id", isAdmin, async (req, res) => {
    try {
      const curryId = req.params.id;
      const curryData = req.body;
      
      // In a real application, you would update the database
      // For this demo, we'll just return the updated data
      res.json({ ...curryData, id: curryId });
    } catch (err) {
      console.error("Error updating curry option:", err);
      res.status(500).json({ message: "Error updating curry option" });
    }
  });

  app.delete("/api/admin/curry-options/:id", isAdmin, async (req, res) => {
    try {
      // In a real application, you would delete from the database
      // For this demo, we'll just return a success message
      res.json({ message: "Curry option deleted successfully" });
    } catch (err) {
      console.error("Error deleting curry option:", err);
      res.status(500).json({ message: "Error deleting curry option" });
    }
  });
  
  // Create subscription directly without payment processing
  app.post("/api/get-or-create-subscription", isAuthenticated, async (req, res) => {
    try {
      const { planId } = req.body;
      const userId = (req.user as any).id;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      // Check if user already has an active subscription
      const existingSubscriptions = await storage.getSubscriptionsByUserId(userId);
      const activeSubscription = existingSubscriptions.find(sub => sub.isActive);
      
      if (activeSubscription) {
        // Just return the existing subscription
        return res.json({
          success: true,
          subscription: activeSubscription,
          message: "You already have an active subscription"
        });
      }
      
      // Create a new subscription
      const subscription = await storage.createSubscription({
        userId,
        plan: planId as "basic" | "premium" | "family",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
        price: req.body.amount || 0,
        mealsPerMonth: planId === "basic" ? 30 : planId === "premium" ? 60 : 90, // Based on plan
      });
      
      // Calculate tax
      const amount = req.body.amount || 0;
      const taxAmount = Math.round(amount * 0.05); // 5% tax
      const totalAmount = amount + taxAmount;
      
      // Construct order details for the frontend
      const orderDetails = {
        amount,
        tax: taxAmount,
        total: totalAmount,
        planName: planId,
      };
      
      res.json({
        success: true,
        subscription,
        orderDetails,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
