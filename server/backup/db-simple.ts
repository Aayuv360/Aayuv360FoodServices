import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Flag to indicate if MongoDB is connected
let mongoConnected = false;

// Simple MongoDB connection function
export async function connectDatabase() {
  if (mongoConnected) {
    return mongoose.connection;
  }
  
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('Missing MONGODB_URI environment variable');
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    mongoConnected = true;
    console.log('MongoDB connection successful');
    
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return null;
  }
}

// Export the mongoose connection
export { mongoose };