const mongoose = require('mongoose');
require('dotenv').config();

// Make sure mongoose uses the latest promise implementation
mongoose.Promise = global.Promise;

// MongoDB connection with retry mechanism
async function connectToMongoDB() {
  const MAX_RETRIES = 3;
  let retries = 0;
  let connected = false;

  while (!connected && retries < MAX_RETRIES) {
    try {
      const MONGODB_URI = process.env.MONGODB_URI;
      
      if (!MONGODB_URI) {
        throw new Error('MongoDB URI is not defined in environment variables');
      }
      
      console.log(`Connecting to MongoDB (attempt ${retries + 1}/${MAX_RETRIES})...`);
      
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });
      
      connected = true;
      console.log('Successfully connected to MongoDB');
      return mongoose.connection;
    } catch (error) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed:`, error.message);
      
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
  
  // Return connection object even if failed
  return mongoose.connection;
}

// Disconnect from MongoDB
async function disconnectFromMongoDB() {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('MongoDB disconnection error:', error.message);
  }
}

module.exports = { connectToMongoDB, disconnectFromMongoDB };