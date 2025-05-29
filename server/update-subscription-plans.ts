import { connectToMongoDB, disconnectFromMongoDB } from "./db";
import { SubscriptionPlan } from "../shared/mongoModels";

const defaultMenuItems = [
  {
    "day": 1,
    "main": "Ragi Dosa",
    "sides": ["Coconut Chutney", "Sambar"]
  },
  {
    "day": 2,
    "main": "Jowar Upma",
    "sides": ["Mixed Vegetable Curry"]
  },
  {
    "day": 3,
    "main": "Millet Pulao",
    "sides": ["Raita", "Papad"]
  },
  {
    "day": 4,
    "main": "Foxtail Millet Lemon Rice",
    "sides": ["Boondi Raita"]
  },
  {
    "day": 5,
    "main": "Little Millet Pongal",
    "sides": ["Coconut Chutney"]
  },
  {
    "day": 6,
    "main": "Barnyard Millet Khichdi",
    "sides": ["Pickle", "Curd"]
  },
  {
    "day": 7,
    "main": "Pearl Millet Roti",
    "sides": ["Dal", "Vegetable Curry"]
  }
];

export async function updateSubscriptionPlansToMenuItems() {
  try {
    console.log("🔄 Starting subscription plan migration to menuItems format...");
    
    await connectToMongoDB();
    
    // Get all subscription plans
    const plans = await SubscriptionPlan.find({});
    console.log(`📋 Found ${plans.length} subscription plans to update`);
    
    for (const plan of plans) {
      // Update the plan with menuItems
      await SubscriptionPlan.findByIdAndUpdate(
        plan._id,
        {
          $set: {
            menuItems: defaultMenuItems,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`✅ Updated plan: ${plan.name} (${plan.id})`);
    }
    
    console.log("🎉 Successfully updated all subscription plans with menuItems format");
    
  } catch (error) {
    console.error("❌ Error updating subscription plans:", error);
    throw error;
  } finally {
    await disconnectFromMongoDB();
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateSubscriptionPlansToMenuItems()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}