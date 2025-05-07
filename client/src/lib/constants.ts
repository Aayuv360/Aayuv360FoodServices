// Subscription plans with pricing and features
export const SUBSCRIPTION_PLANS = [
  {
    id: "basic",
    name: "Basic Plan (7 Days)",
    price: 299900, // ₹2,999
    description: "Perfect for individuals looking to try our millet meals for a week.",
    mealsPerMonth: 7,
    duration: 7, // 7 days (1 week)
    features: [
      { text: "7 meals for one week", included: true },
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
    id: "premium",
    name: "Premium Plan (14 Days)",
    price: 499900, // ₹4,999
    description: "Experience more variety with our premium millet meal plan for two weeks.",
    mealsPerMonth: 14,
    duration: 14, // 14 days (2 weeks)
    features: [
      { text: "14 meals for two weeks", included: true },
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
    id: "family",
    name: "Family Plan (30 Days)",
    price: 899900, // ₹8,999
    description: "Feed the whole family with our millet meals for a full month.",
    mealsPerMonth: 30,
    duration: 30, // 30 days (1 month)
    features: [
      { text: "30 meals for one month", included: true },
      { text: "Preferred delivery window", included: true },
      { text: "Full customization options", included: true },
      { text: "Family nutrition consultation", included: true },
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
  }
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
  { id: "veg-with-egg", name: "Veg with Egg", color: "bg-amber-100 text-amber-800" },
  { id: "non-vegetarian", name: "Non-Vegetarian", color: "bg-red-100 text-red-800" },
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