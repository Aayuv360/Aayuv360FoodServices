import { pgTable, text, serial, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'delivered', 'cancelled']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['basic', 'premium', 'family']);
export const subscriptionTypeEnum = pgEnum('subscription_type', ['default', 'customized']);
export const mealTypeEnum = pgEnum('meal_type', ['breakfast', 'lunch', 'dinner']);
export const dietaryPreferenceEnum = pgEnum('dietary_preference', ['vegetarian', 'non-vegetarian', 'vegan', 'gluten-free', 'low-carb', 'high-protein', 'spicy']);

// Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  role: userRoleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Meals
export const meals = pgTable('meals', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(), // In paise/cents
  imageUrl: text('image_url'),
  calories: integer('calories'),
  protein: integer('protein'),
  carbs: integer('carbs'),
  fat: integer('fat'),
  fiber: integer('fiber'),
  sugar: integer('sugar'),
  mealType: mealTypeEnum('meal_type').notNull(),
  isPopular: boolean('is_popular').default(false),
  isNew: boolean('is_new').default(false),
  dietaryPreferences: dietaryPreferenceEnum('dietary_preferences').array(),
  allergens: text('allergens').array(),
  available: boolean('available').default(true),
});

// Subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  plan: subscriptionPlanEnum('plan').notNull(),
  subscriptionType: subscriptionTypeEnum('subscription_type').default('default').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),
  mealsPerMonth: integer('meals_per_month').notNull(),
  price: integer('price').notNull(), // Monthly price in paise/cents
});

// Custom Meal Plans for Subscriptions
export const customMealPlans = pgTable('custom_meal_plans', {
  id: serial('id').primaryKey(),
  subscriptionId: integer('subscription_id').references(() => subscriptions.id).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday, 1 = Monday, etc.
  mealId: integer('meal_id').references(() => meals.id).notNull(),
});

// Orders
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  totalPrice: integer('total_price').notNull(),
  deliveryTime: timestamp('delivery_time'),
  deliveryAddress: text('delivery_address').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Order Items
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  mealId: integer('meal_id').references(() => meals.id).notNull(),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(), // Price per unit in paise/cents
});

// User Preferences
export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  dietaryPreferences: dietaryPreferenceEnum('dietary_preferences').array(),
  allergies: text('allergies').array(),
});

// Cart Items
export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  mealId: integer('meal_id').references(() => meals.id).notNull(),
  quantity: integer('quantity').notNull(),
  curryOptionId: text('curry_option_id'),
  curryOptionName: text('curry_option_name'),
  curryOptionPrice: integer('curry_option_price'),
});

// Reviews
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  mealId: integer('meal_id').references(() => meals.id).notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Schema validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  role: true,
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
});

export const insertCustomMealPlanSchema = createInsertSchema(customMealPlans).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type CustomMealPlan = typeof customMealPlans.$inferSelect;
export type InsertCustomMealPlan = z.infer<typeof insertCustomMealPlanSchema>;
