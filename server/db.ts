import mongoose from "mongoose";
// No need for dotenv since we're using hardcoded values

let isConnected = false;

export async function connectToMongoDB() {
  if (isConnected) {
    console.log("Using existing MongoDB connection");
    return { db: mongoose.connection.db };
  }

  try {
    // Hardcoded MongoDB connection string instead of using environment variable
    const uri = "mongodb+srv://username:password@cluster.mongodb.net/database";
    
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
