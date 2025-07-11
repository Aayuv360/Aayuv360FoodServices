// Load environment variables first
import dotenv from 'dotenv';
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import mongoose from "mongoose";
import { router as deliveryRoutes } from "./delivery-status";
import { router as notificationRoutes } from "./notifications";
import { router as trackingRoutes } from "./real-time-tracking";
import contactRoutes from "./contact-routes";
// Environment validation - using env-validator instead of env-loader
import { envValidator } from "./env-validator";

// Validate environment configuration on startup
envValidator.printStatus();
if (!envValidator.isValid()) {
  console.error("Critical environment configuration issues detected!");
  if (process.env.NODE_ENV === "production") {
    console.error("Exiting due to missing required environment variables in production");
    process.exit(1);
  }
}

const config = envValidator.getConfig();
console.log(`🚀 Starting server in ${config.NODE_ENV} mode on port ${config.PORT}`);

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.RENDER_EXTERNAL_URL,
      process.env.RENDER_SERVICE_NAME ? `https://${process.env.RENDER_SERVICE_NAME}.onrender.com` : null,
    ].filter(Boolean);

    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      let logLine = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });
  next();
});

async function connectToDatabase() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("Environment check:", {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI_present: !!process.env.MONGODB_URI,
      SESSION_SECRET_present: !!process.env.SESSION_SECRET,
      RAZORPAY_KEY_ID_present: !!process.env.RAZORPAY_KEY_ID
    });
    
    if (!uri) {
      console.error("MONGODB_URI not set - database connection required for production");
      console.error("Please set environment variables in Render.com dashboard:");
      console.error("1. Go to your service in Render dashboard");
      console.error("2. Click Environment tab");
      console.error("3. Add MONGODB_URI, SESSION_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET");
      if (process.env.NODE_ENV === "production") {
        throw new Error("Database connection required in production");
      }
      console.warn("Running in development mode without database");
      return false;
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Successfully connected to MongoDB");
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    console.warn("Continuing without database connection");
    return true;
  }
}

(async () => {
  try {
    await connectToDatabase();

    try {
      const { scheduleDailyNotifications } = await import(
        "./subscription-notifications"
      );
      scheduleDailyNotifications();
      console.log("Daily subscription notifications scheduler initialized");
    } catch (error) {
      console.error("Failed to initialize scheduled tasks:", error);
    }

    const server = await registerRoutes(app);

    app.use("/api/*", (req, res, next) => {
      res.status(404).json({ error: "API endpoint not found" });
    });

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    app.use("/api", trackingRoutes);
    app.use("/", deliveryRoutes);
    app.use("/", notificationRoutes);
    app.use("/", contactRoutes);

    const preferredPort = config.PORT;
    let port = preferredPort;
    let retries = 0;

    const startServer = () => {
      server
        .listen(
          {
            port,
            host: "0.0.0.0",
          },
          () => {
            log(`Server running on port ${port}`);
          },
        )
        .on("error", (e: any) => {
          if (e.code === "EADDRINUSE" && retries < 10) {
            retries++;
            port = Number(preferredPort) + retries;
            log(
              `Port ${Number(preferredPort) + retries - 1} in use, trying ${port}`,
            );
            startServer();
          } else {
            console.error("Failed to start server:", e);
            process.exit(1);
          }
        });
    };

    startServer();
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
