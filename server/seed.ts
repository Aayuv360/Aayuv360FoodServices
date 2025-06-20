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
    const dbConnection = await connectToMongoDB();
    
    if (!dbConnection.db) {
      console.log("Skipping database seeding - no database connection");
      return;
    }

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

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
