// Script to update meal prices in MongoDB database
import mongoose from 'mongoose';
import { MealSchema } from './shared/mongoModels';

async function updateMongoDBPrices() {
  try {
    console.log('Connecting to MongoDB...');
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get the meal model directly
    const MealModel = mongoose.model('Meal', MealSchema);
    
    console.log('Fetching all meals...');
    const meals = await MealModel.find({});
    console.log(`Found ${meals.length} meals to update`);
    
    if (meals.length === 0) {
      console.log('No meals found to update');
      await mongoose.disconnect();
      return;
    }
    
    let updatedCount = 0;
    for (const meal of meals) {
      const oldPrice = meal.price;
      
      // Only update if price seems too high (likely in paise instead of rupees)
      if (oldPrice > 1000) {
        const newPrice = Math.round(oldPrice / 100);
        console.log(`Updating meal '${meal.name}': ${oldPrice} → ${newPrice}`);
        
        meal.price = newPrice;
        await meal.save();
        updatedCount++;
      } else {
        console.log(`Skipping meal '${meal.name}' with price ${oldPrice} (already in rupees)`);
      }
    }
    
    console.log(`Price update completed successfully! Updated ${updatedCount} meals.`);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating prices:', error);
  }
}

// Execute the update function
updateMongoDBPrices();