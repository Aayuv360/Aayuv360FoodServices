const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
async function connectMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('Missing MONGODB_URI environment variable');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('MongoDB connection successful');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Export the MongoDB connection
module.exports = { connectMongoDB, mongoose };