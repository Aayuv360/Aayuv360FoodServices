import express from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./vite";
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnvironment, getEnvironmentConfig } from './env-loader';

// Load environment variables using the proper loader
loadEnvironment();

// Get environment configuration
const config = getEnvironmentConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
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
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// Start server
async function startServer() {
  try {
    // Connect to database
    const connected = await connectToDatabase();
    if (!connected) {
      console.error('Failed to connect to MongoDB');
      process.exit(1);
    }
    
    // Register API routes
    const server = await registerRoutes(app);
    
    // Serve static files from dist/client
    app.use(express.static(path.join(process.cwd(), 'client', 'dist')));
    
    // Handle SPA routes - always return index.html for non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(process.cwd(), 'client', 'dist', 'index.html'));
      }
    });
    
    const port = process.env.PORT || 5000;
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      console.log(`Production server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();