import mongoose from 'mongoose';

let connected = false;

export async function connectToMongoDB() {
  if (connected) return;
  
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI must be set. Did you forget to provision a MongoDB database?");
    }
    
    await mongoose.connect(uri);
    connected = true;
  } catch (error) {
    throw error;
  }
}

export async function disconnectFromMongoDB() {
  if (!connected) return;
  
  try {
    await mongoose.disconnect();
    connected = false;
  } catch (error) {
    throw error;
  }
}
