import mongoose from 'mongoose';

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/millet-meals';
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Initialize collections and indexes if needed
    await setupCollections();
    
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Setup collections and indexes
async function setupCollections() {
  // Add any collection setups or index creation here
  // For example: await mongoose.model('User').createIndexes();
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