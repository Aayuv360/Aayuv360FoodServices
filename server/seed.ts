import { connectToMongoDB } from "./db";
import { User as UserModel, SubscriptionPlan as SubscriptionPlanModel } from "../shared/mongoModels";
import { milletMeals, MealDataItem } from "./mealData";
import { Meal as MealModel } from "../shared/mongoModels";
import bcrypt from "bcryptjs";

async function hashPassword(password: string) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
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
        id: 1,
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
        id: 2,
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
        id: 3,
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

    // Add subscription plans
    const existingPlans = await SubscriptionPlanModel.find().lean();
    
    if (existingPlans.length === 0) {
      console.log("Adding subscription plans to MongoDB...");
      
      const subscriptionPlans = [
        {
          id: 1,
          planType: "basic",
          name: "Basic Millet Plan",
          description: "Essential millet meals for healthy living",
          price: 2000,
          duration: 30,
          mealsPerDay: 2,
          dietaryPreference: "veg",
          features: ["2 meals per day", "Basic millet variety", "Standard delivery"],
          isActive: true,
          timeSlot: "morning",
          deliveryAddressId: 1,
          menuItems: [
            { day: 1, main: "Pearl Millet Khichdi", sides: ["Coconut Chutney"] },
            { day: 2, main: "Finger Millet Roti", sides: ["Dal"] },
            { day: 3, main: "Foxtail Millet Upma", sides: ["Sambar"] },
            { day: 4, main: "Little Millet Idli", sides: ["Chutney"] },
            { day: 5, main: "Barnyard Millet Pulao", sides: ["Raita"] },
            { day: 6, main: "Kodo Millet Biryani", sides: ["Pickle"] },
            { day: 7, main: "Proso Millet Soup", sides: ["Bread"] }
          ]
        },
        {
          id: 2,
          planType: "premium",
          name: "Premium Millet Plan",
          description: "Premium millet meals with variety and customization",
          price: 3500,
          duration: 30,
          mealsPerDay: 3,
          dietaryPreference: "veg",
          features: ["3 meals per day", "Premium millet variety", "Priority delivery", "Customization options"],
          isActive: true,
          timeSlot: "evening",
          deliveryAddressId: 1,
          menuItems: [
            { day: 1, main: "Multi-Millet Power Bowl", sides: ["Avocado", "Tahini"] },
            { day: 2, main: "Pearl Millet Pizza Base", sides: ["Vegetables", "Cheese"] },
            { day: 3, main: "Finger Millet Granola", sides: ["Fruits", "Yogurt"] },
            { day: 4, main: "Foxtail Millet Pasta", sides: ["Tomato Sauce", "Herbs"] },
            { day: 5, main: "Kodo Millet Kheer", sides: ["Nuts", "Cardamom"] },
            { day: 6, main: "Barnyard Millet Risotto", sides: ["Mushrooms", "Cheese"] },
            { day: 7, main: "Little Millet Tabbouleh", sides: ["Herbs", "Lemon"] }
          ]
        },
        {
          id: 3,
          planType: "family",
          name: "Family Millet Plan",
          description: "Large portions for families with diverse millet options",
          price: 5000,
          duration: 30,
          mealsPerDay: 4,
          dietaryPreference: "veg",
          features: ["4 meals per day", "Family portions", "All millet varieties", "Free delivery", "Weekly customization"],
          isActive: true,
          timeSlot: "flexible",
          deliveryAddressId: 1,
          menuItems: [
            { day: 1, main: "Pearl Millet Pancakes", sides: ["Honey", "Fruits"] },
            { day: 2, main: "Finger Millet Dosa", sides: ["Chutney", "Sambar"] },
            { day: 3, main: "Foxtail Millet Wrap", sides: ["Hummus", "Vegetables"] },
            { day: 4, main: "Kodo Millet Ice Cream", sides: ["Nuts", "Berries"] },
            { day: 5, main: "Barnyard Millet Burger", sides: ["Fries", "Salad"] },
            { day: 6, main: "Little Millet Curry", sides: ["Rice", "Papad"] },
            { day: 7, main: "Multi-Millet Power Bowl", sides: ["Complete nutrition"] }
          ]
        }
      ];

      await Promise.all(subscriptionPlans.map(plan => SubscriptionPlanModel.create(plan)));
      console.log(`${subscriptionPlans.length} subscription plans added successfully to MongoDB`);
    }

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
