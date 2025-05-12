import mongoose, { Schema, Document } from 'mongoose';

// Define interfaces for MongoDB documents
export interface UserDocument extends Document {
  id: number;
  username: string;
  email: string;
  password: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface CurryOption {
  id: string;
  name: string;
  priceAdjustment: number;
  description?: string;
  mealId?: number | null;
}

export interface MealDocument extends Document {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  dietaryPreferences: string[];
  isPopular: boolean;
  isNewItem: boolean; // Renamed from isNew to avoid Mongoose reserved word
  ingredients?: string[];
  allergens?: string[];
  isAvailable: boolean;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  curryOptions?: CurryOption[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItemDocument extends Document {
  id: number;
  userId: number;
  mealId: number;
  quantity: number;
  notes?: string;
  curryOptionId?: string;
  curryOptionName?: string;
  curryOptionPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDocument extends Document {
  id: number;
  userId: number;
  status: string;
  totalPrice: number;
  deliveryTime?: Date;
  deliveryAddress?: string;
  paymentMethod?: string;
  items: {
    mealId: number;
    quantity: number;
    notes?: string;
    curryOptionId?: string;
    curryOptionName?: string;
    curryOptionPrice?: number;
  }[];
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionDocument extends Document {
  id: number;
  userId: number;
  plan: string;
  subscriptionType: string;
  startDate: Date;
  status: string;
  mealsPerMonth: number;
  price: number;
  paymentMethod: string;
  dietaryPreference: string;
  personCount: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressDocument extends Document {
  id: number;
  userId: number;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationDocument extends Document {
  id: number;
  area: string;
  pincode: string;
  deliveryFee: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define CurryOption model
export interface CurryOptionDocument extends Document {
  id: string;
  name: string;
  description?: string;
  priceAdjustment: number;
  mealId?: number | null; // Kept for backward compatibility
  mealIds?: number[]; // Array of meal IDs that this curry option applies to
  createdAt: Date;
  updatedAt: Date;
}

// Define Mongoose schemas
const userSchema = new Schema<UserDocument>({
  id: { type: Number, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const curryOptionSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  priceAdjustment: { type: Number, required: true },
  description: String,
  mealId: { type: Number, default: null },
});

// Schema definition to support both object curryOptions and array format
const mealSchema = new Schema<MealDocument>({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: String,
  dietaryPreferences: [String],
  isPopular: { type: Boolean, default: false },
  isNewItem: { type: Boolean, default: false }, // Renamed from isNew to avoid Mongoose reserved word
  ingredients: [String],
  allergens: [String],
  isAvailable: { type: Boolean, default: true },
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  fiber: Number,
  // Support both formats: array of arrays [id, name, price] or curryOptionSchema objects
  curryOptions: { 
    type: Schema.Types.Mixed, 
    default: [],
    get: function(val: any) {
      // Convert object format to array format if needed
      if (Array.isArray(val) && val.length > 0) {
        // If already in array format, return as-is
        if (Array.isArray(val[0])) {
          return val;
        }
        // Convert from object format to array format
        return val.map((opt: any) => [opt.id, opt.name, opt.priceAdjustment]);
      }
      return val;
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const cartItemSchema = new Schema<CartItemDocument>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  mealId: { type: Number, required: true },
  quantity: { type: Number, required: true },
  notes: String,
  curryOptionId: String,
  curryOptionName: String,
  curryOptionPrice: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const orderSchema = new Schema<OrderDocument>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  status: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  deliveryTime: Date,
  deliveryAddress: String,
  paymentMethod: String,
  items: [{
    mealId: { type: Number, required: true },
    quantity: { type: Number, required: true },
    notes: String,
    curryOptionId: String,
    curryOptionName: String,
    curryOptionPrice: Number,
  }],
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const subscriptionSchema = new Schema<SubscriptionDocument>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  plan: { type: String, required: true },
  subscriptionType: { type: String, required: true },
  startDate: { type: Date, required: true },
  status: { type: String, required: true },
  mealsPerMonth: { type: Number, required: true },
  price: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  dietaryPreference: { type: String, required: true },
  personCount: { type: Number, required: true },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const addressSchema = new Schema<AddressDocument>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const locationSchema = new Schema<LocationDocument>({
  id: { type: Number, required: true, unique: true },
  area: { type: String, required: true },
  pincode: { type: String, required: true },
  deliveryFee: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create and export models
export const User = mongoose.model<UserDocument>('User', userSchema);
export const Meal = mongoose.model<MealDocument>('Meal', mealSchema);
export const CartItem = mongoose.model<CartItemDocument>('CartItem', cartItemSchema);
export const Order = mongoose.model<OrderDocument>('Order', orderSchema);
export const Subscription = mongoose.model<SubscriptionDocument>('Subscription', subscriptionSchema);
export const Address = mongoose.model<AddressDocument>('Address', addressSchema);
export const Location = mongoose.model<LocationDocument>('Location', locationSchema);

// Define Review schema
export interface ReviewDocument extends Document {
  id: number;
  userId: number;
  mealId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  mealId: { type: Number, required: true },
  rating: { type: Number, required: true },
  comment: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Counter collection for auto-incrementing IDs
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

export const Review = mongoose.model<ReviewDocument>('Review', reviewSchema);
export const Counter = mongoose.model('Counter', counterSchema);

// Curry Option schema
const curryOptionDocumentSchema = new Schema<CurryOptionDocument>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  priceAdjustment: { type: Number, required: true },
  mealId: { type: Number, default: null }, // Kept for backward compatibility
  mealIds: { type: [Number], default: [] }, // Array of meal IDs that this curry option applies to
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const CurryOption = mongoose.model<CurryOptionDocument>('CurryOption', curryOptionDocumentSchema);

// Function to get the next sequence value for a given model
export async function getNextSequence(name: string): Promise<number> {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}