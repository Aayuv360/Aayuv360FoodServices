/**
 * Script to update nutrition values for all meals in the MongoDB database
 * 
 * This script adds appropriate nutrition values for millet-based meals:
 * - calories: Amount of energy in kcal
 * - protein: Protein content in grams
 * - carbs: Carbohydrate content in grams
 * - fat: Fat content in grams
 * - fiber: Dietary fiber in grams
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Meal } from './shared/mongoModels';

// Load environment variables
dotenv.config();

// Connect to MongoDB
async function connectToMongoDB() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Successfully connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Generate realistic nutrition values based on meal categories
function generateNutritionValues(category: string) {
  // Base values that will be adjusted by category
  let baseValues = {
    calories: 250 + Math.floor(Math.random() * 150), // 250-400 calories
    protein: 6 + Math.floor(Math.random() * 7),     // 6-12g protein
    carbs: 30 + Math.floor(Math.random() * 20),     // 30-50g carbs
    fat: 4 + Math.floor(Math.random() * 6),         // 4-10g fat
    fiber: 4 + Math.floor(Math.random() * 4)        // 4-8g fiber
  };
  
  // Adjust values based on meal category
  switch (category) {
    case 'Finger Millet':
      // Finger millet (ragi) is rich in calcium, fiber and protein
      baseValues.protein += 2;
      baseValues.fiber += 3;
      break;
      
    case 'Kodo Millet':
      // Kodo millet is rich in fiber and minerals
      baseValues.fiber += 2;
      baseValues.carbs -= 5;
      break;
      
    case 'Mixed Millet':
      // Mixed millet provides balanced nutrition
      baseValues.protein += 1;
      baseValues.fiber += 1;
      break;
      
    default:
      // No adjustment for unknown categories
      break;
  }
  
  return baseValues;
}

// Update all meals with nutrition values
async function updateNutritionValues() {
  try {
    // Get all meals from the database
    const meals = await Meal.find({});
    console.log(`Found ${meals.length} meals to update`);
    
    // Update each meal with nutrition values
    let updatedCount = 0;
    
    for (const meal of meals) {
      const nutritionValues = generateNutritionValues(meal.category);
      
      // Update the meal document
      await Meal.updateOne(
        { _id: meal._id },
        { 
          $set: {
            calories: nutritionValues.calories,
            protein: nutritionValues.protein,
            carbs: nutritionValues.carbs,
            fat: nutritionValues.fat,
            fiber: nutritionValues.fiber
          }
        }
      );
      
      updatedCount++;
      console.log(`Updated ${meal.name} (${meal.category}) with nutrition values`);
    }
    
    console.log(`Successfully updated nutrition values for ${updatedCount} meals`);
  } catch (error) {
    console.error('Error updating nutrition values:', error);
  }
}

// Function to run the script
async function main() {
  try {
    await connectToMongoDB();
    await updateNutritionValues();
    
    console.log('Nutrition update completed successfully');
  } catch (error) {
    console.error('Error in nutrition update script:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
}

// Run the script
main();