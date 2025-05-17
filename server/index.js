// Simple MongoDB-based server
const express = require('express');
const mongoose = require('mongoose');
const { createServer } = require('http');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Connect to MongoDB
async function startServer() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('Missing MONGODB_URI environment variable');
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('MongoDB connection successful');
    
    // Create HTTP server
    const server = createServer(app);
    
    // Add a simple test endpoint
    app.get('/api/test', (req, res) => {
      res.json({ message: 'Server is running correctly with MongoDB' });
    });
    
    // Start listening
    const port = process.env.PORT || 5000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
    
    return server;
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

// Start the server
startServer();