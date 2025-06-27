import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Note: Images now served from MongoDB via /api/images/:id endpoint

// Logging middleware
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
    if (!uri) {
      console.warn("MONGODB_URI not set - running without database connection");
      return true; // Allow app to start without database in development
    }

    await mongoose.connect(uri);
    console.log("Successfully connected to MongoDB");
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    console.warn("Continuing without database connection");
    return true; // Allow app to continue without database
  }
}

// Add global process error handlers
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  console.error("Stack:", error.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Start server
(async () => {
  try {
    // Connect to database
    await connectToDatabase();

    // Initialize scheduled tasks
    try {
      const { scheduleDailyNotifications } = await import(
        "./subscription-notifications"
      );
      const { scheduleStatusUpdates } = await import(
        "./subscription-status-updater"
      );

      scheduleDailyNotifications();
      console.log("Daily subscription notifications scheduler initialized");

      // Initialize subscription status updater
      scheduleStatusUpdates();
      console.log("Subscription status updater initialized");
    } catch (error) {
      console.error("Failed to initialize scheduled tasks:", error);
    }

    // Register API routes BEFORE Vite middleware
    const server = await registerRoutes(app);

    // Ensure API routes are handled before Vite
    app.use("/api/*", (req, res, next) => {
      // If we reach here, the API route wasn't found
      res.status(404).json({ error: "API endpoint not found" });
    });

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log detailed error information
      console.error("Global error handler caught:", {
        message: err.message,
        stack: err.stack,
        status,
        url: _req.url,
        method: _req.method,
        timestamp: new Date().toISOString(),
      });

      res.status(status).json({
        message,
        timestamp: new Date().toISOString(),
      });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const preferredPort = process.env.PORT || 5000;
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
