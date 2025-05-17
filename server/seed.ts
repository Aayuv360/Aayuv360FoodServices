import { connectToMongoDB } from "./db";
import { User as UserModel } from "../shared/mongoModels";
import { milletMeals, MealDataItem } from "./mealData";
import { Meal as MealModel } from "../shared/mongoModels";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Hash password for database
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");
    
    // Connect to MongoDB
    await connectToMongoDB();

    // Check if admin user exists
    const adminUser = await UserModel.findOne({ username: "admin" });

    // Add admin user if it doesn't exist
    if (!adminUser) {
      console.log("Adding admin user...");

      await UserModel.create({
        username: "admin",
        password: await hashPassword("admin123"), // Secure in a real app
        name: "Admin User",
        email: "admin@aayuv.com",
        phone: "+91 9876543210",
        address: "Hyderabad, Telangana",
        role: "admin",
        createdAt: new Date(),
      });

      console.log("Admin user created successfully");
    }

    // Check if manager user exists
    const managerUser = await UserModel.findOne({ username: "manager" });

    // Add manager user if it doesn't exist
    if (!managerUser) {
      console.log("Adding manager user...");

      await UserModel.create({
        username: "manager",
        password: await hashPassword("manager123"), // Secure in a real app
        name: "Manager User",
        email: "manager@aayuv.com",
        phone: "+91 9876543211",
        address: "Gachibowli, Hyderabad",
        role: "manager",
        createdAt: new Date(),
      });

      console.log("Manager user created successfully");
    }

    // Check if guest user exists
    const guestUser = await UserModel.findOne({ username: "guest" });

    // Add guest user if it doesn't exist
    if (!guestUser) {
      console.log("Adding guest user...");

      await UserModel.create({
        username: "guest",
        password: await hashPassword("guest123"), // Secure in a real app
        name: "Guest User",
        email: "guest@example.com",
        phone: null,
        address: null,
        role: "user",
        createdAt: new Date(),
      });

      console.log("Guest user created successfully");
    }

    // Check if there are meals in MongoDB
    const existingMeals = await MealModel.find().lean();

    // Add sample meals if none exist
    if (existingMeals.length === 0 && milletMeals.length > 0) {
      console.log("Adding sample meals to MongoDB...");

      // Create promises for all meal insertions
      const mealInsertPromises = milletMeals.map((meal: MealDataItem) => {
        return MealModel.create({
          ...meal,
          available: true,
        });
      });

      // Insert all meals in parallel
      await Promise.all(mealInsertPromises);
      
      console.log(`${milletMeals.length} sample meals added successfully to MongoDB`);
    }

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
