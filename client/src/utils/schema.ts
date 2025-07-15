import { z } from "zod";

export const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  addressLine1: z.string().min(5, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const menuItemSchema = z.object({
  day: z.number(),
  main: z.string(),
  sides: z.array(z.string()),
});

export const planSchema = z.object({
  _id: z.string(),
  id: z.string(),
  name: z.string(),
  price: z.number(),
  duration: z.number(),
  description: z.string(),
  features: z.array(z.string()),
  dietaryPreference: z.enum(["veg", "veg_with_egg", "nonveg"]),
  planType: z.string(),
  menuItems: z.array(menuItemSchema).optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  __v: z.number(),
});
export const subscriptionSchema = z.object({
  plan: planSchema,
  dietaryPreference: z.enum(["veg", "veg_with_egg", "nonveg"]),
  personCount: z
    .number()
    .min(1, "At least 1 person required")
    .max(10, "Maximum 10 persons allowed")
    .default(1),
  subscriptionType: z.enum(["default"]).default("default"),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  useNewAddress: z.boolean().default(false),
  newAddress: addressSchema.optional(),
  timeSlot: z.string().optional(),
  modifydelivaryAdrs: z.string().optional(),
});
