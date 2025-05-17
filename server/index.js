const express = require('express');
const { createServer } = require('http');
const { setupVite, serveStatic, log } = require('./vite');
const { connectToMongoDB } = require('./db');

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });
  
  next();
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

// Start the server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Create HTTP server
    const server = createServer(app);
    
    // Register API routes
    const routesModule = require('./routes');
    await routesModule.registerRoutes(app);
    
    // Set up Vite for development
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    // Start listening
    const port = process.env.PORT || 5000;
    server.listen(port, "0.0.0.0", () => {
      log(`Server running on port ${port}`);
      console.log(`Server started successfully on port ${port}`);
    });
    
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();