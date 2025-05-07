import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertCartItemSchema, 
  insertOrderSchema,
  insertOrderItemSchema, 
  insertSubscriptionSchema,
  insertUserPreferencesSchema, 
  insertReviewSchema,
  insertCustomMealPlanSchema
} from "@shared/schema";

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

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
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
          return {
            ...item,
            meal,
          };
        })
      );
      
      res.json(itemsWithDetails);
    } catch (err) {
      res.status(500).json({ message: "Error fetching cart items" });
    }
  });
  
  app.post("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId,
      });
      
      const cartItem = await storage.addToCart(cartItemData);
      const meal = await storage.getMeal(cartItem.mealId);
      
      res.status(201).json({
        ...cartItem,
        meal,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
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
      
      res.json({
        ...cartItem,
        meal,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: err.errors });
      } else {
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
      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId,
      });
      
      const order = await storage.createOrder(orderData);
      
      // Create order items from cart
      const cartItems = await storage.getCartItems(userId);
      
      const orderItems = await Promise.all(
        cartItems.map(async (item) => {
          const meal = await storage.getMeal(item.mealId);
          
          if (!meal) {
            throw new Error(`Meal with id ${item.mealId} not found`);
          }
          
          const orderItemData = {
            orderId: order.id,
            mealId: item.mealId,
            quantity: item.quantity,
            price: meal.price,
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

  // Location API
  app.get("/api/locations", async (req, res) => {
    try {
      const { query } = req.query;
      const defaultLocations = [
        { id: 1, name: "Hyderabad, Gachibowli" },
        { id: 2, name: "Hyderabad, Madhapur" },
        { id: 3, name: "Hyderabad, Hitech City" },
        { id: 4, name: "Hyderabad, Jubilee Hills" },
        { id: 5, name: "Hyderabad, Banjara Hills" },
        { id: 6, name: "Hyderabad, Secunderabad" },
        { id: 7, name: "Hyderabad, Kukatpally" },
        { id: 8, name: "Hyderabad, Ameerpet" }
      ];
      
      if (query && typeof query === 'string') {
        const searchQuery = query.toLowerCase();
        const filteredLocations = defaultLocations.filter(location => 
          location.name.toLowerCase().includes(searchQuery)
        );
        return res.json(filteredLocations);
      }
      
      res.json(defaultLocations);
    } catch (err) {
      res.status(500).json({ message: "Error fetching locations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
