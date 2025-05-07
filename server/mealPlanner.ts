import { Meal, dietaryPreferenceEnum } from "@shared/schema";
import { storage } from "./storage";

interface MealPlan {
  date: Date;
  mealId: number;
  meal?: Meal;
}

interface WeeklyMealPlan {
  weekStartDate: Date;
  meals: MealPlan[];
}

// Valid dietary preference types
type DietaryPreference = typeof dietaryPreferenceEnum.enumValues[number];

export class MealPlannerService {
  // Generate a meal plan for a specific date range
  async generateMealPlan(
    startDate: Date,
    daysToGenerate: number = 7, 
    userId?: number,
    preferences?: DietaryPreference[]
  ): Promise<MealPlan[]> {
    // Get all available meals from the database
    const allMeals = await storage.getAllMeals();
    
    // If preferences are provided, filter meals accordingly
    let eligibleMeals = allMeals;
    if (preferences && preferences.length > 0) {
      eligibleMeals = allMeals.filter(meal => {
        // Check if the meal matches any of the dietary preferences
        return preferences.some(pref => 
          meal.dietaryPreferences && meal.dietaryPreferences.includes(pref)
        );
      });
      
      // If no meals match the preferences, fall back to all meals
      if (eligibleMeals.length === 0) {
        eligibleMeals = allMeals;
      }
    }
    
    // Get user-specific preferences if userId is provided
    if (userId) {
      const userPreferences = await storage.getUserPreferences(userId);
      if (userPreferences) {
        // Apply user preferences to meal filtering
        if (userPreferences.dietaryPreferences && userPreferences.dietaryPreferences.length > 0) {
          const userDietPrefs = userPreferences.dietaryPreferences;
          eligibleMeals = eligibleMeals.filter(meal => {
            // Either meal has no dietary restrictions, or it matches user preferences
            return !meal.dietaryPreferences || 
              meal.dietaryPreferences.some(pref => userDietPrefs.includes(pref));
          });
        }

        // Filter out meals the user is allergic to
        if (userPreferences.allergies && userPreferences.allergies.length > 0) {
          eligibleMeals = eligibleMeals.filter(meal => {
            // Skip meals containing allergens
            return !userPreferences.allergies?.some(
              allergen => meal.allergens && meal.allergens.includes(allergen)
            );
          });
        }
      }
    }

    // Create a rotated meal plan
    const mealPlan: MealPlan[] = [];
    const mealCount = eligibleMeals.length;
    
    // Make sure we have at least one meal to work with
    if (mealCount === 0) {
      throw new Error("No eligible meals found for the meal plan");
    }

    // Generate a meal for each day in the range
    for (let i = 0; i < daysToGenerate; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Select a meal using a rotation algorithm
      // This ensures a good distribution and avoids repetition
      const mealIndex = i % mealCount;
      const meal = eligibleMeals[mealIndex];
      
      mealPlan.push({
        date,
        mealId: meal.id,
        meal
      });
    }
    
    return mealPlan;
  }

  // Generate weekly meal plans for a given number of weeks
  async generateWeeklyMealPlans(
    startDate: Date,
    numberOfWeeks: number = 4,
    userId?: number,
    preferences?: DietaryPreference[]
  ): Promise<WeeklyMealPlan[]> {
    const weeklyPlans: WeeklyMealPlan[] = [];
    
    for (let week = 0; week < numberOfWeeks; week++) {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(weekStartDate.getDate() + (week * 7));
      
      const meals = await this.generateMealPlan(
        weekStartDate,
        7, // Generate 7 days per week
        userId,
        preferences
      );
      
      weeklyPlans.push({
        weekStartDate,
        meals
      });
    }
    
    return weeklyPlans;
  }

  // Get a specific meal plan for a user
  async getUserMealPlan(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<MealPlan[]> {
    // Check if the user has a subscription
    const userSubscriptions = await storage.getSubscriptionsByUserId(userId);
    const activeSubscription = userSubscriptions.find(sub => sub.isActive);
    
    if (!activeSubscription) {
      throw new Error("User does not have an active subscription");
    }
    
    // Check if user has a custom meal plan (for customized subscriptions)
    if (activeSubscription.subscriptionType === "customized") {
      const customMealPlans = await storage.getCustomMealPlans(activeSubscription.id);
      
      if (customMealPlans && customMealPlans.length > 0) {
        // Convert custom meal plans to the MealPlan format
        const mealPlans: MealPlan[] = [];
        
        for (const customPlan of customMealPlans) {
          // Calculate the date based on day of week (0 = Sunday, 1 = Monday, etc.)
          const currentDate = new Date(startDate);
          const daysToAdd = (customPlan.dayOfWeek - currentDate.getDay() + 7) % 7;
          const date = new Date(currentDate);
          date.setDate(currentDate.getDate() + daysToAdd);
          
          const meal = await storage.getMeal(customPlan.mealId);
          
          if (date >= startDate && date <= endDate && meal) {
            mealPlans.push({
              date,
              mealId: customPlan.mealId,
              meal
            });
          }
        }
        
        if (mealPlans.length > 0) {
          return mealPlans;
        }
      }
    }
    
    // If no custom plan, generate a standard plan
    const userPreferences = await storage.getUserPreferences(userId);
    const preferencesList = userPreferences?.dietaryPreferences || [];
    
    return this.generateMealPlan(
      startDate,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      userId,
      preferencesList
    );
  }
  
  // Helper to get meal recommendations for a user
  async getMealRecommendations(
    userId: number,
    count: number = 5
  ): Promise<Meal[]> {
    // Get all meals
    const allMeals = await storage.getAllMeals();
    
    // Get user preferences
    const userPreferences = await storage.getUserPreferences(userId);
    
    // If no preferences, return random selection
    if (!userPreferences || !userPreferences.dietaryPreferences || userPreferences.dietaryPreferences.length === 0) {
      // Shuffle array and return requested number of meals
      return this.shuffleArray(allMeals).slice(0, count);
    }
    
    // Filter meals based on user preferences
    const preferredMeals = allMeals.filter(meal => {
      // Skip meals with allergens the user is allergic to
      if (userPreferences.allergies && userPreferences.allergies.length > 0) {
        if (meal.allergens && meal.allergens.some(allergen => 
          userPreferences.allergies?.includes(allergen))) {
          return false;
        }
      }
      
      // Prioritize meals matching dietary preferences
      if (meal.dietaryPreferences && userPreferences.dietaryPreferences) {
        return meal.dietaryPreferences.some(pref => 
          userPreferences.dietaryPreferences?.includes(pref)
        );
      }
      
      return true;
    });
    
    // If no meals match preferences, fall back to all meals
    const mealsToRecommend = preferredMeals.length > 0 ? preferredMeals : allMeals;
    
    // Shuffle and return the requested number of meals
    return this.shuffleArray(mealsToRecommend).slice(0, count);
  }
  
  // Helper to shuffle an array (Fisher-Yates algorithm)
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Export a singleton instance
export const mealPlannerService = new MealPlannerService();