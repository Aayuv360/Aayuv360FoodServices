import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple MongoDB connection helper
export async function connectMongoDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is missing');
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connection successful!');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    return null;
  }
}

// Simplified index file to start the application
export async function startServer() {
  try {
    const connection = await connectMongoDB();
    
    if (!connection) {
      console.warn('Using memory fallback');
      globalThis.useMemoryFallback = true;
    } else {
      console.log('Connected to MongoDB successfully');
      globalThis.useMemoryFallback = false;
    }
    
    // Now import and start the actual server
    const { startApplication } = await import('./server.js');
    await startApplication();
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is executed directly
if (import.meta.url === import.meta.main) {
  startServer();
}