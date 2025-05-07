import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { z } from "zod";
import Stripe from "stripe";
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

// Initialize Stripe with the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: Missing Stripe secret key. Stripe payment features will not work.');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : null;

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
  
  // Stripe payment routes
  if (stripe) {
    // Create a payment intent for one-time payments
    app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
      try {
        const { amount, planId } = req.body;
        
        if (!amount) {
          return res.status(400).json({ message: "Amount is required" });
        }
        
        // Convert amount to cents (Stripe uses smallest currency unit)
        const amountInCents = Math.round(amount * 100);
        
        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "inr",
          payment_method_types: ["card"],
          metadata: {
            userId: (req.user as any).id.toString(),
            planId: planId || "",
          },
        });
        
        // Calculate tax
        const taxAmount = Math.round(amountInCents * 0.05); // 5% tax
        const totalAmount = amountInCents + taxAmount;
        
        // Construct order details
        const orderDetails = {
          amount: amountInCents,
          tax: taxAmount,
          total: totalAmount,
        };
        
        if (planId) {
          // If it's a subscription, add the plan details
          const plans = await storage.getSubscription(parseInt(planId));
          if (plans) {
            (orderDetails as any).planName = plans.plan; // Use the plan enum value as the name
          }
        }
        
        res.json({
          clientSecret: paymentIntent.client_secret,
          orderDetails,
        });
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ message: error.message });
      }
    });
    
    // Create or get subscription for subscription payments
    app.post("/api/get-or-create-subscription", isAuthenticated, async (req, res) => {
      try {
        const { planId } = req.body;
        const userId = (req.user as any).id;
        
        if (!planId) {
          return res.status(400).json({ message: "Plan ID is required" });
        }
        
        // Check if user already has this subscription plan
        // For now, we'll skip this check and always create a new payment intent
        // In a production app, you would want to check for existing active subscriptions
        // const userSubscriptions = await storage.getSubscriptionsByUserId(userId);
        // const existingSubscription = userSubscriptions.find(sub => sub.plan === planId && sub.isActive) as any;
        
        // Temporarily set to null since we'll create a new one
        const existingSubscription = null;
        
        // Get subscription plan details from the SUBSCRIPTION_PLANS constant
        // This is a workaround since we're using constant plans instead of database records
        const { amount } = req.body;
        
        if (!amount) {
          return res.status(400).json({ message: "Amount is required" });
        }
        
        // Convert to cents (Stripe uses smallest currency unit)
        const amountInCents = Math.round(amount * 100);
        
        // Create a PaymentIntent for the initial payment
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "inr",
          payment_method_types: ["card"],
          metadata: {
            userId: userId.toString(),
            planId: planId,
            subscriptionId: "new", // Always creating a new subscription for now
          },
        });
        
        // Calculate tax
        const taxAmount = Math.round(amountInCents * 0.05); // 5% tax
        const totalAmount = amountInCents + taxAmount;
        
        // Construct order details
        const orderDetails = {
          amount: amountInCents,
          tax: taxAmount,
          total: totalAmount,
          planName: planId, // Using planId directly since we don't have the subscriptionPlan object
        };
        
        res.json({
          clientSecret: paymentIntent.client_secret,
          orderDetails,
        });
      } catch (error: any) {
        console.error("Error with subscription payment:", error);
        res.status(500).json({ message: error.message });
      }
    });
    
    // Webhook to handle Stripe events (payment succeeded, failed, etc.)
    app.post("/api/stripe-webhook", async (req, res) => {
      const signature = req.headers["stripe-signature"] as string;
      
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).json({ message: "Stripe webhook secret is not configured" });
      }
      
      try {
        const event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        
        // Handle the event
        switch (event.type) {
          case "payment_intent.succeeded":
            // Payment was successful, update subscription or order status
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const { userId, planId, subscriptionId } = paymentIntent.metadata;
            
            if (subscriptionId && subscriptionId !== "new") {
              // Update existing subscription
              await storage.updateSubscription(parseInt(subscriptionId), {
                isActive: true,
              });
            } else if (planId) {
              // Create new subscription with the plan ID as the plan value
              await storage.createSubscription({
                userId: parseInt(userId),
                plan: planId as "basic" | "premium" | "family",
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                isActive: true,
                price: 0, // This will be updated with actual price
                mealsPerMonth: 0, // This will be updated based on plan
              });
            }
            break;
            
          case "payment_intent.payment_failed":
            // Payment failed, update subscription or order status
            const failedPayment = event.data.object as Stripe.PaymentIntent;
            console.log("Payment failed:", failedPayment.id);
            break;
            
          default:
            console.log(`Unhandled event type ${event.type}`);
        }
        
        res.json({ received: true });
      } catch (err: any) {
        console.error("Webhook error:", err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
      }
    });
  } else {
    // Stripe is not configured, return error responses
    app.post("/api/create-payment-intent", (req, res) => {
      res.status(503).json({ message: "Stripe is not configured. Please set the STRIPE_SECRET_KEY environment variable." });
    });
    
    app.post("/api/get-or-create-subscription", (req, res) => {
      res.status(503).json({ message: "Stripe is not configured. Please set the STRIPE_SECRET_KEY environment variable." });
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
