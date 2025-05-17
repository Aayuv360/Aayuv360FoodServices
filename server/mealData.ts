// This file contains the meal data types for MongoDB storage
// Imported by mongoStorage.ts and seed.ts

export interface MealDataItem {
  id?: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  mealType: string;
  category?: string;
  dietaryPreference: string;
  ingredients?: string[];
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  available?: boolean;
  popular?: boolean;
  spiceLevel?: number;
  preparationTime?: number;
  basePrice?: number;
  defaultCurryOption?: string;
}

// An empty array for initialization - we're now using MongoDB
export const milletMeals: MealDataItem[] = [];