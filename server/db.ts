import mongoose from "mongoose";

let isConnected = false;

export async function connectToMongoDB() {
  if (isConnected) {
    console.log("Using existing MongoDB connection");
    return { db: mongoose.connection.db };
  }

  try {
    // Use the environment variable from .env file
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }
    
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    isConnected = true;
    console.log("Successfully connected to MongoDB");
    return { db: mongoose.connection.db };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    console.log("Please check your MongoDB connection string and ensure MongoDB is running");
    
    // Create a fallback mechanism if MongoDB isn't connected
    console.warn("Continuing with limited functionality - database features will be unavailable");
    return { db: null };
  }
}

export async function disconnectFromMongoDB() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("MongoDB disconnection error:", error);
    throw error;
  }
}

export { mongoose };
