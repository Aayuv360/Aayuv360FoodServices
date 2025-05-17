import mongoose from 'mongoose';

// This file is now just a simple redirect to mongodb.ts
// to avoid conflicting exports
import { connectToMongoDB as connect, disconnectFromMongoDB as disconnect } from './mongodb';

// Re-export functions from mongodb.ts
export const connectToMongoDB = connect;
export const disconnectFromMongoDB = disconnect;

// Function below is kept for reference but not used
async function _connectToMongoDBOld() {
  const MAX_RETRIES = 3;
  let retries = 0;
  let connected = false;

  while (!connected && retries < MAX_RETRIES) {
    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/millet-meals';
      
      if (!MONGODB_URI) {
        throw new Error('MongoDB URI is not defined in environment variables');
      }
      
      console.log(`Connecting to MongoDB (attempt ${retries + 1}/${MAX_RETRIES})...`);
      
      // Mongoose 6+ no longer needs useNewUrlParser, useUnifiedTopology
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 30000, // Increase server selection timeout
        connectTimeoutMS: 30000,         // Connection timeout
        socketTimeoutMS: 45000,          // Socket timeout
      });
      
      connected = true;
      console.log('Successfully connected to MongoDB');
      
      // Set up connection error handlers
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected. Application will continue in degraded mode.');
      });
      
      return mongoose.connection;
    } catch (error) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed:`, error);
      
      if (retries >= MAX_RETRIES) {
        console.error('All MongoDB connection attempts failed. App will continue with limited functionality.');
      } else {
        // Wait before next retry (exponential backoff)
        const delay = 1000 * Math.pow(2, retries);
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Return connection object even if failed (will have readyState = 0)
  return mongoose.connection;
}

// Setup collections and indexes with better error handling
async function setupCollections() {
  try {
    const { 
      User, Meal, CartItem, Order, Subscription, Address, Location, Counter 
    } = await import('../shared/mongoModels');
    
    // Create indexes (with try/catch for each one)
    try {
      await User.createIndexes();
    } catch (err) {
      console.warn('Warning: Failed to create User indexes:', err);
    }
    
    try {
      await Meal.createIndexes();
    } catch (err) {
      console.warn('Warning: Failed to create Meal indexes:', err);
    }
    
    try {
      await CartItem.createIndexes();
    } catch (err) {
      console.warn('Warning: Failed to create CartItem indexes:', err);
    }
    
    try {
      await Order.createIndexes();
    } catch (err) {
      console.warn('Warning: Failed to create Order indexes:', err);
    }
    
    try {
      await Subscription.createIndexes();
    } catch (err) {
      console.warn('Warning: Failed to create Subscription indexes:', err);
    }
    
    try {
      await Address.createIndexes();
    } catch (err) {
      console.warn('Warning: Failed to create Address indexes:', err);
    }
    
    try {
      await Location.createIndexes();
    } catch (err) {
      console.warn('Warning: Failed to create Location indexes:', err);
    }
    
    // Initialize counters if they don't exist
    const counters = ['user', 'meal', 'cartItem', 'order', 'subscription', 'address', 'location'];
    for (const counter of counters) {
      try {
        await Counter.findOneAndUpdate(
          { _id: counter },
          { $setOnInsert: { seq: 0 } },
          { upsert: true }
        );
      } catch (err) {
        console.warn(`Warning: Failed to initialize counter '${counter}':`, err);
      }
    }
    
    console.log('MongoDB collections and indexes initialization completed');
  } catch (error) {
    console.error('Error setting up MongoDB collections:', error);
    // Don't throw, allow the application to continue
  }
}

// Disconnect from MongoDB
async function disconnectFromMongoDB() {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
  }
}

// Export connection functions
export { connectToMongoDB, disconnectFromMongoDB };