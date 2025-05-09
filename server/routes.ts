import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
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
import { seedDatabase } from "./seed";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed the database with initial data (admin users, etc.)
  try {
    await seedDatabase();
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }

  // Configure session
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
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

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}