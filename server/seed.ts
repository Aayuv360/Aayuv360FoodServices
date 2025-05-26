import { connectToMongoDB } from "./db";
import { User as UserModel, SubscriptionPlan } from "../shared/mongoModels";
import { milletMeals, MealDataItem } from "./mealData";
import { Meal as MealModel } from "../shared/mongoModels";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");
    await connectToMongoDB();

    const adminUser = await UserModel.findOne({ username: "admin" });

    if (!adminUser) {
      console.log("Adding admin user...");

      await UserModel.create({
        username: "admin",
        password: await hashPassword("admin123"),
        name: "Admin User",
        email: "admin@aayuv.com",
        phone: "+91 9876543210",
        address: "Hyderabad, Telangana",
        role: "admin",
        createdAt: new Date(),
      });

      console.log("Admin user created successfully");
    }

    const managerUser = await UserModel.findOne({ username: "manager" });

    if (!managerUser) {
      console.log("Adding manager user...");

      await UserModel.create({
        username: "manager",
        password: await hashPassword("manager123"),
        name: "Manager User",
        email: "manager@aayuv.com",
        phone: "+91 9876543211",
        address: "Gachibowli, Hyderabad",
        role: "manager",
        createdAt: new Date(),
      });

      console.log("Manager user created successfully");
    }

    const guestUser = await UserModel.findOne({ username: "guest" });

    if (!guestUser) {
      console.log("Adding guest user...");

      await UserModel.create({
        username: "guest",
        password: await hashPassword("guest123"),
        name: "Guest User",
        email: "guest@example.com",
        phone: null,
        address: null,
        role: "user",
        createdAt: new Date(),
      });

      console.log("Guest user created successfully");
    }

    const existingMeals = await MealModel.find().lean();

    if (existingMeals.length === 0 && milletMeals.length > 0) {
      console.log("Adding sample meals to MongoDB...");

      const mealInsertPromises = milletMeals.map((meal: MealDataItem) => {
        return MealModel.create({
          ...meal,
          available: true,
        });
      });

      await Promise.all(mealInsertPromises);

      console.log(
        `${milletMeals.length} sample meals added successfully to MongoDB`,
      );
    }

    // Seed subscription plans
    const existingPlans = await SubscriptionPlan.find().lean();
    
    if (existingPlans.length === 0) {
      console.log("Adding initial subscription plans to MongoDB...");
      
      const initialPlans = [
        // Vegetarian Plans
        {
          id: "veg-basic",
          name: "Basic Vegetarian Plan",
          price: 2999,
          duration: 30,
          description: "Essential vegetarian millet meals for daily nutrition",
          features: ["15 meals per month", "Basic meal variety", "Standard delivery"],
          dietaryPreference: "veg",
          planType: "basic",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "veg-premium",
          name: "Premium Vegetarian Plan",
          price: 4499,
          duration: 30,
          description: "Premium vegetarian millet meals with enhanced variety",
          features: ["25 meals per month", "Premium meal variety", "Priority delivery", "Customization options"],
          dietaryPreference: "veg",
          planType: "premium",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "veg-family",
          name: "Family Vegetarian Plan",
          price: 7999,
          duration: 30,
          description: "Complete vegetarian family meal solution",
          features: ["45 meals per month", "Family portions", "Meal customization", "Free delivery", "Nutrition consultation"],
          dietaryPreference: "veg",
          planType: "family",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Vegetarian with Egg Plans
        {
          id: "vegegg-basic",
          name: "Basic Veg + Egg Plan",
          price: 3299,
          duration: 30,
          description: "Vegetarian meals with egg options for added protein",
          features: ["15 meals per month", "Egg-based options", "Standard delivery"],
          dietaryPreference: "veg_with_egg",
          planType: "basic",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "vegegg-premium",
          name: "Premium Veg + Egg Plan",
          price: 4799,
          duration: 30,
          description: "Premium vegetarian and egg-based meal combinations",
          features: ["25 meals per month", "Enhanced protein options", "Priority delivery", "Meal customization"],
          dietaryPreference: "veg_with_egg",
          planType: "premium",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "vegegg-family",
          name: "Family Veg + Egg Plan",
          price: 8499,
          duration: 30,
          description: "Complete family nutrition with vegetarian and egg options",
          features: ["45 meals per month", "Family portions", "Protein variety", "Free delivery", "Nutrition consultation"],
          dietaryPreference: "veg_with_egg",
          planType: "family",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        // Non-Vegetarian Plans
        {
          id: "nonveg-basic",
          name: "Basic Non-Veg Plan",
          price: 3799,
          duration: 30,
          description: "Complete non-vegetarian millet meal experience",
          features: ["15 meals per month", "Chicken & fish options", "Standard delivery"],
          dietaryPreference: "nonveg",
          planType: "basic",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "nonveg-premium",
          name: "Premium Non-Veg Plan",
          price: 5499,
          duration: 30,
          description: "Premium non-vegetarian meals with gourmet options",
          features: ["25 meals per month", "Premium meat options", "Priority delivery", "Chef specials"],
          dietaryPreference: "nonveg",
          planType: "premium",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "nonveg-family",
          name: "Family Non-Veg Plan",
          price: 9499,
          duration: 30,
          description: "Complete family non-vegetarian meal solution",
          features: ["45 meals per month", "Family portions", "Meat variety", "Free delivery", "Nutrition consultation"],
          dietaryPreference: "nonveg",
          planType: "family",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await SubscriptionPlan.insertMany(initialPlans);
      console.log(`${initialPlans.length} subscription plans added successfully to MongoDB`);
    }

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
