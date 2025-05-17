import mongoose from 'mongoose';

console.log("Checking MongoDB connection status...");

async function checkConnection() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error("MONGODB_URI environment variable is missing");
      return;
    }
    
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    console.log("✅ MongoDB connection successful");
    console.log("Connection state:", mongoose.connection.readyState);
    
    // Print collections
    const collections = await mongoose.connection.db.collections();
    console.log("Collections available:", collections.map(c => c.collectionName));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
  }
}

checkConnection();