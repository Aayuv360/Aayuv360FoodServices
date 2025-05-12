// This file contains updated meal routes with proper curry options formatting
import { Request, Response } from "express";
import { Meal as MealModel, CurryOption } from "../shared/mongoModels";
import { formatMealCurryOptions } from "./curry-formatter";

export async function getMealsHandler(req: Request, res: Response) {
  try {
    console.log("Fetching all meals directly from MongoDB...");
    
    // Use MongoDB directly instead of going through storage
    const meals = await MealModel.find().lean();
    
    // Get all curry options from the CurryOption collection
    const globalCurryOptions = await CurryOption.find().lean();
    
    // Enhance each meal with curry options as key-value objects format: {id, name, price}
    const enhancedMeals = meals.map(meal => {
      return formatMealCurryOptions(meal, globalCurryOptions);
    });
    
    console.log(`Retrieved ${meals.length} meals from MongoDB`);
    res.json(enhancedMeals);
  } catch (err) {
    console.error("Error fetching meals:", err);
    res.status(500).json({ message: "Error fetching meals" });
  }
}

export async function getMealByIdHandler(req: Request, res: Response) {
  try {
    const mealId = parseInt(req.params.id);
    
    // Use MongoDB directly instead of going through storage
    const meal = await MealModel.findOne({ id: mealId }).lean();
    
    if (!meal) {
      return res.status(404).json({ message: "Meal not found" });
    }
    
    // Get all curry options from the CurryOption collection
    const globalCurryOptions = await CurryOption.find().lean();
    
    // Format curry options as key-value objects
    const enhancedMeal = formatMealCurryOptions(meal, globalCurryOptions);
    
    res.json(enhancedMeal);
  } catch (err) {
    console.error("Error fetching meal:", err);
    res.status(500).json({ message: "Error fetching meal" });
  }
}

export async function getMealsByTypeHandler(req: Request, res: Response) {
  try {
    const mealType = req.params.type;
    
    // Use MongoDB directly
    const meals = await MealModel.find({ mealType }).lean();
    
    // Get all curry options from the CurryOption collection
    const globalCurryOptions = await CurryOption.find().lean();
    
    // Enhance each meal with curry options in the requested format
    const enhancedMeals = meals.map(meal => {
      return formatMealCurryOptions(meal, globalCurryOptions);
    });
    
    res.json(enhancedMeals);
  } catch (err) {
    console.error(`Error fetching meals of type ${req.params.type}:`, err);
    res.status(500).json({ message: `Error fetching meals of type ${req.params.type}` });
  }
}

export function registerMealRoutes(app: any) {
  app.get("/api/meals", getMealsHandler);
  app.get("/api/meals/:id", getMealByIdHandler);
  app.get("/api/meals/type/:type", getMealsByTypeHandler);
}