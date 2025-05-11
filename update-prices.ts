// Script to update meal prices in the MongoDB database
import mongoose from 'mongoose';
import { Meal } from './shared/mongoModels';

async function updatePrices() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    console.log('Fetching all meals...');
    const meals = await Meal.find({});
    console.log(`Found ${meals.length} meals to update`);
    
    for (const meal of meals) {
      const oldPrice = meal.price;
      const newPrice = Math.round(oldPrice / 100);
      console.log(`Updating meal '${meal.name}': ${oldPrice} -> ${newPrice}`);
      
      meal.price = newPrice;
      await meal.save();
    }
    
    console.log('Price update completed successfully!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error updating prices:', error);
  }
}

updatePrices();