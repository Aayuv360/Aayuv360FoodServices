// Subscription plans with pricing and features
export const SUBSCRIPTION_PLANS = [
  // Vegetarian options
  {
    id: "basic-veg",
    name: "Basic Plan (Veg)",
    price: 299900, // ₹2,999
    description: "Perfect for individuals looking to try our vegetarian millet meals.",
    mealsPerMonth: 12,
    type: "vegetarian",
    features: [
      { text: "12 vegetarian meals per month", included: true },
      { text: "Flexible delivery schedule", included: true },
      { text: "Basic customization options", included: true },
      { text: "Nutrition consultation", included: false },
    ],
    weeklyMeals: {
      monday: { main: "Ragi Dosa", sides: ["Coconut Chutney", "Tomato Chutney"] },
      tuesday: { main: "Jowar Upma", sides: ["Mixed Vegetable Curry"] },
      wednesday: { main: "Millet Pulao", sides: ["Raita", "Papad"] },
      thursday: { main: "Foxtail Millet Lemon Rice", sides: ["Boondi Raita"] },
      friday: { main: "Little Millet Pongal", sides: ["Coconut Chutney", "Sambar"] },
      saturday: { main: "Pearl Millet Khichdi", sides: ["Kadhi", "Papad"] },
      sunday: { main: "Kodo Millet Bisibelebath", sides: ["Raita", "Pickle"] }
    }
  },
  {
    id: "premium-veg",
    name: "Premium Plan (Veg)",
    price: 499900, // ₹4,999
    description: "Ideal for regular healthy eating with greater vegetarian variety.",
    mealsPerMonth: 20,
    type: "vegetarian",
    features: [
      { text: "20 vegetarian meals per month", included: true },
      { text: "Priority delivery slots", included: true },
      { text: "Full customization options", included: true },
      { text: "Monthly nutrition consultation", included: true },
    ],
    weeklyMeals: {
      monday: { main: "Ragi Dosa", sides: ["Coconut Chutney", "Tomato Chutney"] },
      tuesday: { main: "Jowar Upma", sides: ["Mixed Vegetable Curry"] },
      wednesday: { main: "Millet Pulao", sides: ["Raita", "Papad"] },
      thursday: { main: "Foxtail Millet Lemon Rice", sides: ["Boondi Raita"] },
      friday: { main: "Little Millet Pongal", sides: ["Coconut Chutney", "Sambar"] },
      saturday: { main: "Pearl Millet Khichdi", sides: ["Kadhi", "Papad"] },
      sunday: { main: "Kodo Millet Bisibelebath", sides: ["Raita", "Pickle"] }
    }
  },
  {
    id: "family-veg",
    name: "Family Plan (Veg)",
    price: 899900, // ₹8,999
    description: "Complete vegetarian solution for families seeking healthy millet meals.",
    mealsPerMonth: 40,
    type: "vegetarian",
    features: [
      { text: "40 vegetarian meals per month", included: true },
      { text: "Preferred delivery window", included: true },
      { text: "Full customization with family portions", included: true },
      { text: "Bi-weekly nutrition consultation", included: true },
    ],
    weeklyMeals: {
      monday: { main: "Ragi Dosa", sides: ["Coconut Chutney", "Tomato Chutney"] },
      tuesday: { main: "Jowar Upma", sides: ["Mixed Vegetable Curry"] },
      wednesday: { main: "Millet Pulao", sides: ["Raita", "Papad"] },
      thursday: { main: "Foxtail Millet Lemon Rice", sides: ["Boondi Raita"] },
      friday: { main: "Little Millet Pongal", sides: ["Coconut Chutney", "Sambar"] },
      saturday: { main: "Pearl Millet Khichdi", sides: ["Kadhi", "Papad"] },
      sunday: { main: "Kodo Millet Bisibelebath", sides: ["Raita", "Pickle"] }
    }
  },
  
  // Non-vegetarian options
  {
    id: "basic-nonveg",
    name: "Basic Plan (Non-Veg)",
    price: 349900, // ₹3,499
    description: "Perfect for individuals looking to try our non-vegetarian millet meals.",
    mealsPerMonth: 12,
    type: "non-vegetarian",
    features: [
      { text: "12 non-veg meals per month", included: true },
      { text: "Flexible delivery schedule", included: true },
      { text: "Basic customization options", included: true },
      { text: "Nutrition consultation", included: false },
    ],
    weeklyMeals: {
      monday: { main: "Ragi Chicken Biryani", sides: ["Raita", "Salan"] },
      tuesday: { main: "Jowar Chicken Curry", sides: ["Jowar Roti"] },
      wednesday: { main: "Millet Fish Pulao", sides: ["Raita", "Papad"] },
      thursday: { main: "Pearl Millet Mutton Curry", sides: ["Pearl Millet Roti"] },
      friday: { main: "Little Millet Chicken Pongal", sides: ["Pickle", "Papad"] },
      saturday: { main: "Foxtail Millet Keema", sides: ["Millet Roti", "Salad"] },
      sunday: { main: "Kodo Millet Egg Curry", sides: ["Kodo Millet Rice", "Pickle"] }
    }
  },
  {
    id: "premium-nonveg",
    name: "Premium Plan (Non-Veg)",
    price: 549900, // ₹5,499
    description: "Ideal for regular healthy eating with greater non-veg variety.",
    mealsPerMonth: 20,
    type: "non-vegetarian",
    features: [
      { text: "20 non-veg meals per month", included: true },
      { text: "Priority delivery slots", included: true },
      { text: "Full customization options", included: true },
      { text: "Monthly nutrition consultation", included: true },
    ],
    weeklyMeals: {
      monday: { main: "Ragi Chicken Biryani", sides: ["Raita", "Salan"] },
      tuesday: { main: "Jowar Chicken Curry", sides: ["Jowar Roti"] },
      wednesday: { main: "Millet Fish Pulao", sides: ["Raita", "Papad"] },
      thursday: { main: "Pearl Millet Mutton Curry", sides: ["Pearl Millet Roti"] },
      friday: { main: "Little Millet Chicken Pongal", sides: ["Pickle", "Papad"] },
      saturday: { main: "Foxtail Millet Keema", sides: ["Millet Roti", "Salad"] },
      sunday: { main: "Kodo Millet Egg Curry", sides: ["Kodo Millet Rice", "Pickle"] }
    }
  },
  {
    id: "family-nonveg",
    name: "Family Plan (Non-Veg)",
    price: 949900, // ₹9,499
    description: "Complete non-vegetarian solution for families seeking healthy millet meals.",
    mealsPerMonth: 40,
    type: "non-vegetarian",
    features: [
      { text: "40 non-veg meals per month", included: true },
      { text: "Preferred delivery window", included: true },
      { text: "Full customization with family portions", included: true },
      { text: "Bi-weekly nutrition consultation", included: true },
    ],
    weeklyMeals: {
      monday: { main: "Ragi Chicken Biryani", sides: ["Raita", "Salan"] },
      tuesday: { main: "Jowar Chicken Curry", sides: ["Jowar Roti"] },
      wednesday: { main: "Millet Fish Pulao", sides: ["Raita", "Papad"] },
      thursday: { main: "Pearl Millet Mutton Curry", sides: ["Pearl Millet Roti"] },
      friday: { main: "Little Millet Chicken Pongal", sides: ["Pickle", "Papad"] },
      saturday: { main: "Foxtail Millet Keema", sides: ["Millet Roti", "Salad"] },
      sunday: { main: "Kodo Millet Egg Curry", sides: ["Kodo Millet Rice", "Pickle"] }
    }
  },
];

// Delivery time slots
export const DELIVERY_TIME_SLOTS = [
  { value: "10:00-11:00", label: "10:00 AM - 11:00 AM" },
  { value: "11:00-12:00", label: "11:00 AM - 12:00 PM" },
  { value: "12:00-13:00", label: "12:00 PM - 1:00 PM" },
  { value: "13:00-14:00", label: "1:00 PM - 2:00 PM" },
  { value: "17:00-18:00", label: "5:00 PM - 6:00 PM" },
  { value: "18:00-19:00", label: "6:00 PM - 7:00 PM" },
  { value: "19:00-20:00", label: "7:00 PM - 8:00 PM" },
  { value: "20:00-21:00", label: "8:00 PM - 9:00 PM" },
];

// Meal Types for filtering
export const MEAL_TYPES = [
  { id: "all", name: "All Meals" },
  { id: "breakfast", name: "Breakfast" },
  { id: "lunch", name: "Lunch" },
  { id: "dinner", name: "Dinner" },
];

// Dietary preferences for filtering
export const DIETARY_PREFERENCES = [
  { id: "vegetarian", name: "Vegetarian", color: "bg-green-100 text-green-800" },
  { id: "gluten-free", name: "Gluten-Free", color: "bg-yellow-100 text-yellow-800" },
  { id: "high-protein", name: "High Protein", color: "bg-blue-100 text-blue-800" },
  { id: "low-carb", name: "Low Carb", color: "bg-purple-100 text-purple-800" },
  { id: "vegan", name: "Vegan", color: "bg-emerald-100 text-emerald-800" },
  { id: "spicy", name: "Spicy", color: "bg-red-100 text-red-800" },
];

// Social links
export const SOCIAL_LINKS = {
  facebook: "https://facebook.com/mealmillet",
  instagram: "https://instagram.com/mealmillet",
  twitter: "https://twitter.com/mealmillet",
};

// Company information
export const COMPANY_INFO = {
  name: "MealMillet",
  address: "123 Food Street, Hyderabad, Telangana, India",
  email: "support@mealmillet.com",
  phone: "+91 9876543210",
  bankAccount: {
    name: "MealMillet Services",
    accountNumber: "1234567890",
    ifscCode: "MEAL0001234",
    bank: "Millet Bank",
  },
};
