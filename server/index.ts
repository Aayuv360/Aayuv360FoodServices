import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
      throw new Error("MONGODB_URI must be set");
    }
    
    await mongoose.connect(uri);
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// Start server
(async () => {
  try {
    // Connect to database
    const connected = await connectToDatabase();
    if (!connected) {
      console.error('Failed to connect to MongoDB');
      process.exit(1);
    }
    


    // Register other API routes
    const server = await registerRoutes(app);
    
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
    
    const preferredPort = process.env.PORT || 5000;
    let port = preferredPort;
    let retries = 0;
    
    const startServer = () => {
      server.listen({
        port,
        host: "0.0.0.0",
      }, () => {
        log(`Server running on port ${port}`);
      }).on('error', (e: any) => {
        if (e.code === 'EADDRINUSE' && retries < 10) {
          retries++;
          port = Number(preferredPort) + retries;
          log(`Port ${Number(preferredPort) + retries - 1} in use, trying ${port}`);
          startServer();
        } else {
          console.error('Failed to start server:', e);
          process.exit(1);
        }
      });
    };
    
    startServer();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();