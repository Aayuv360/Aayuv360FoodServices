import { z } from "zod";

// Enums as arrays for TypeScript support
export const userRoles = ["user", "admin", "manager"] as const;
export const orderStatuses = [
  "pending",
  "confirmed",
  "delivered",
  "cancelled",
] as const;
export const subscriptionPlans = ["basic", "premium", "family"] as const;
export const subscriptionTypes = ["default", "customized"] as const;
export const subscriptionStatuses = [
  "pending",
  "active",
  "expired",
  "cancelled",
] as const;
export const mealTypes = ["breakfast", "lunch", "dinner"] as const;
export const dietaryPreferences = [
  "vegetarian",
  "non-vegetarian",
  "vegan",
  "gluten-free",
  "low-carb",
  "high-protein",
  "spicy",
] as const;

// Zod schemas for MongoDB document validation
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(userRoles).default("user"),
  createdAt: z
    .date()
    .optional()
    .default(() => new Date()),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
});

export const mealSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  imageUrl: z.string().optional(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  fiber: z.number().optional(),
  sugar: z.number().optional(),
  mealType: z.enum(mealTypes),
  isPopular: z.boolean().default(false),
  isNew: z.boolean().default(false),
  dietaryPreferences: z.array(z.enum(dietaryPreferences)).optional(),
  allergens: z.array(z.string()).optional(),
  available: z.boolean().default(true),
  category: z.string().optional(),
  curryOptions: z
    .array(z.tuple([z.string(), z.string(), z.number()]))
    .optional(),
});

export const curryOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceAdjustment: z.number().default(0),
  description: z.string().optional(),
  mealIds: z.array(z.number()).optional(),
});

export const cartItemSchema = z.object({
  id: z.number(),
  userId: z.number(),
  mealId: z.number(),
  quantity: z.number(),
  curryOptionId: z.string().optional(),
  curryOptionName: z.string().optional(),
  curryOptionPrice: z.number().optional(),
  notes: z.string().optional(),
  category: z.string().optional(),
});

export const orderSchema = z.object({
  id: z.number(),
  userId: z.number(),
  status: z.enum(orderStatuses).default("pending"),
  totalPrice: z.number(),
  deliveryTime: z.date().optional(),
  deliveryAddress: z.string(),
  createdAt: z
    .date()
    .optional()
    .default(() => new Date()),
  paymentId: z.string().optional(),
  paymentStatus: z.string().optional(),
  items: z
    .array(
      z.object({
        mealId: z.number(),
        quantity: z.number(),
        price: z.number(),
        notes: z.string().optional(),
        curryOptionId: z.string().optional(),
        curryOptionName: z.string().optional(),
        curryOptionPrice: z.number().optional(),
      }),
    )
    .optional(),
});

export const subscriptionSchema = z.object({
  id: z.number(),
  userId: z.number(),
  plan: z.enum(subscriptionPlans),
  subscriptionType: z.enum(subscriptionTypes).default("default"),
  startDate: z.date(),
  endDate: z.date().optional(),
  status: z.enum(subscriptionStatuses).default("pending"),
  paymentMethod: z.string().optional(),
  paymentId: z.string().optional(),
  orderId: z.string().optional(),
  paymentSignature: z.string().optional(),
  dietaryPreference: z.string().optional(),
  personCount: z.number().default(1),
  mealsPerMonth: z.number(),
  price: z.number(),
  customMealPlans: z
    .array(
      z.object({
        dayOfWeek: z.number(),
        mealId: z.number(),
      }),
    )
    .optional(),
});

export const addressSchema = z.object({
  id: z.number(),
  userId: z.number(),
  name: z.string(),
  phone: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  isDefault: z.boolean().default(false),
  createdAt: z
    .date()
    .optional()
    .default(() => new Date()),
});

export const reviewSchema = z.object({
  id: z.number(),
  userId: z.number(),
  mealId: z.number(),
  rating: z.number(),
  comment: z.string().optional(),
  createdAt: z
    .date()
    .optional()
    .default(() => new Date()),
});

export const locationSchema = z.object({
  id: z.number(),
  area: z.string(),
  pincode: z.string(),
  deliveryAvailable: z.boolean().default(true),
  deliveryCharge: z.number().default(0),
});

// Insert schemas (omitting auto-generated fields)
export const insertUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  role: true,
});
export const insertMealSchema = mealSchema.omit({ id: true });
export const insertCartItemSchema = cartItemSchema.omit({ id: true });
export const insertOrderSchema = orderSchema.omit({
  id: true,
  createdAt: true,
  status: true,
});
export const insertSubscriptionSchema = subscriptionSchema.omit({ id: true });
export const insertAddressSchema = addressSchema.omit({
  id: true,
  createdAt: true,
});
export const insertReviewSchema = reviewSchema.omit({
  id: true,
  createdAt: true,
});
export const insertCurryOptionSchema = curryOptionSchema;

// Export types
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Meal = z.infer<typeof mealSchema>;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type CurryOption = z.infer<typeof curryOptionSchema>;
export type InsertCurryOption = z.infer<typeof insertCurryOptionSchema>;

export type CartItem = z.infer<typeof cartItemSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = z.infer<typeof orderSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = z.infer<
  z.ZodObject<{
    mealId: z.ZodNumber;
    quantity: z.ZodNumber;
    price: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
    curryOptionId: z.ZodOptional<z.ZodString>;
    curryOptionName: z.ZodOptional<z.ZodString>;
    curryOptionPrice: z.ZodOptional<z.ZodNumber>;
  }>
>;

export type Subscription = z.infer<typeof subscriptionSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type CustomMealPlan = z.infer<
  z.ZodObject<{
    dayOfWeek: z.ZodNumber;
    mealId: z.ZodNumber;
  }>
>;

export type Address = z.infer<typeof addressSchema>;
export type InsertAddress = z.infer<typeof insertAddressSchema>;

export type Review = z.infer<typeof reviewSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Location = z.infer<typeof locationSchema>;
