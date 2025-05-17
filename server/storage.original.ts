import {
  type User, type InsertUser, type Meal, type InsertMeal,
  type Subscription, type InsertSubscription, type Order, type InsertOrder,
  type OrderItem, type CartItem, type InsertCartItem,
  type Review, type InsertReview,
  type CustomMealPlan, type Address, type InsertAddress
} from "@shared/schema";
import { milletMeals } from "./mealItems";
import { CurryOption } from "../shared/mongoModels";

import * as expressSession from "express-session";

export interface IStorage {
  // Session store
  sessionStore: expressSession.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Meal operations
  getMeal(id: number): Promise<Meal | undefined>;
  getAllMeals(): Promise<Meal[]>;
  getMealsByType(mealType: string): Promise<Meal[]>;
  getMealsByDietaryPreference(preference: string): Promise<Meal[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  updateMeal(id: number, meal: Partial<Meal>): Promise<Meal | undefined>;
  
  // Subscription operations
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionsByUserId(userId: number): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<Subscription>): Promise<Subscription | undefined>;
  getAllSubscriptions(): Promise<Subscription[]>;
  
  // Custom Meal Plan operations
  getCustomMealPlans(subscriptionId: number): Promise<CustomMealPlan[]>;
  createCustomMealPlan(customMealPlan: InsertCustomMealPlan): Promise<CustomMealPlan>;
  deleteCustomMealPlan(id: number): Promise<boolean>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  
  // Order Item operations
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  getAllOrderItems(): Promise<OrderItem[]>;
  
  // User Preferences operations
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences | undefined>;
  
  // Cart operations
  getCartItems(userId: number): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined>;
  updateCartItem(id: number, updates: Partial<CartItem>): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;
  
  // Review operations
  getReviewsByMealId(mealId: number): Promise<Review[]>;
  getReviewsByUserId(userId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  getAllReviews(): Promise<Review[]>;
  
  // Address operations
  getAddresses(userId: number): Promise<Address[]>;
  getAddressById(id: number): Promise<Address | undefined>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: number, address: Partial<Address>): Promise<Address | undefined>;
  deleteAddress(id: number): Promise<boolean>;
  
  // Curry Option operations
  getCurryOptions(): Promise<any[]>;
  getCurryOption(id: string): Promise<any | undefined>;
  createCurryOption(curryOption: any): Promise<any>;
  updateCurryOption(id: string, curryOption: any): Promise<any | undefined>;
  deleteCurryOption(id: string): Promise<boolean>;
}

import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(expressSession);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private meals: Map<number, Meal>;
  private subscriptions: Map<number, Subscription>;
  private customMealPlans: Map<number, CustomMealPlan>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private userPreferences: Map<number, UserPreferences>;
  private cartItems: Map<number, CartItem>;
  private reviews: Map<number, Review>;
  private addresses: Map<number, Address>;
  private curryOptions: Map<string, any>; // Curry options storage
  
  sessionStore: expressSession.Store;
  
  private userId: number;
  private mealId: number;
  private subscriptionId: number;
  private customMealPlanId: number;
  private orderId: number;
  private orderItemId: number;
  private userPreferencesId: number;
  private cartItemId: number;
  private reviewId: number;
  private addressId: number;
  
  constructor() {
    this.users = new Map();
    this.meals = new Map();
    this.subscriptions = new Map();
    this.customMealPlans = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.userPreferences = new Map();
    this.cartItems = new Map();
    this.reviews = new Map();
    this.addresses = new Map();
    this.curryOptions = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    this.userId = 1;
    this.mealId = 1;
    this.subscriptionId = 1;
    this.customMealPlanId = 1;
    this.orderId = 1;
    this.orderItemId = 1;
    this.userPreferencesId = 1;
    this.cartItemId = 1;
    this.reviewId = 1;
    this.addressId = 1;
    
    // Initialize with sample meals
    this.initializeSampleMeals();
  }
  
  // Initialize sample meal data
  private initializeSampleMeals(): void {
    // Use the imported millet meals 
    milletMeals.forEach(meal => this.createMeal(meal));
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id, role: 'user', createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser: User = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Meal operations
  async getMeal(id: number): Promise<Meal | undefined> {
    return this.meals.get(id);
  }
  
  async getAllMeals(): Promise<Meal[]> {
    return Array.from(this.meals.values());
  }
  
  async getMealsByType(mealType: string): Promise<Meal[]> {
    return Array.from(this.meals.values()).filter(meal => meal.mealType === mealType);
  }
  
  async getMealsByDietaryPreference(preference: string): Promise<Meal[]> {
    return Array.from(this.meals.values()).filter(meal => 
      meal.dietaryPreferences && meal.dietaryPreferences.includes(preference as any)
    );
  }
  
  async createMeal(meal: InsertMeal): Promise<Meal> {
    const id = this.mealId++;
    const newMeal: Meal = { ...meal, id, available: true };
    this.meals.set(id, newMeal);
    return newMeal;
  }
  
  async updateMeal(id: number, meal: Partial<Meal>): Promise<Meal | undefined> {
    const existingMeal = this.meals.get(id);
    if (!existingMeal) return undefined;
    
    const updatedMeal: Meal = { ...existingMeal, ...meal };
    this.meals.set(id, updatedMeal);
    return updatedMeal;
  }
  
  // Subscription operations
  async getSubscription(id: number): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }
  
  async getSubscriptionsByUserId(userId: number): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(sub => sub.userId === userId);
  }
  
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const id = this.subscriptionId++;
    const newSubscription: Subscription = { ...subscription, id };
    this.subscriptions.set(id, newSubscription);
    return newSubscription;
  }
  
  async updateSubscription(id: number, subscription: Partial<Subscription>): Promise<Subscription | undefined> {
    const existingSubscription = this.subscriptions.get(id);
    if (!existingSubscription) return undefined;
    
    const updatedSubscription: Subscription = { ...existingSubscription, ...subscription };
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }
  
  // Custom Meal Plan operations
  async getCustomMealPlans(subscriptionId: number): Promise<CustomMealPlan[]> {
    return Array.from(this.customMealPlans.values()).filter(plan => plan.subscriptionId === subscriptionId);
  }
  
  async createCustomMealPlan(customMealPlan: InsertCustomMealPlan): Promise<CustomMealPlan> {
    const id = this.customMealPlanId++;
    const newCustomMealPlan: CustomMealPlan = { ...customMealPlan, id };
    this.customMealPlans.set(id, newCustomMealPlan);
    return newCustomMealPlan;
  }
  
  async deleteCustomMealPlan(id: number): Promise<boolean> {
    if (!this.customMealPlans.has(id)) return false;
    return this.customMealPlans.delete(id);
  }
  
  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderId++;
    const newOrder: Order = { ...order, id, status: 'pending', createdAt: new Date() };
    this.orders.set(id, newOrder);
    return newOrder;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;
    
    const updatedOrder: Order = { ...existingOrder, status: status as any };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  // Order Item operations
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }
  
  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemId++;
    const newOrderItem: OrderItem = { ...orderItem, id };
    this.orderItems.set(id, newOrderItem);
    return newOrderItem;
  }
  
  // User Preferences operations
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(pref => pref.userId === userId);
  }
  
  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.userPreferencesId++;
    const newPreferences: UserPreferences = { ...preferences, id };
    this.userPreferences.set(id, newPreferences);
    return newPreferences;
  }
  
  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const existingPreferences = Array.from(this.userPreferences.values()).find(pref => pref.userId === userId);
    if (!existingPreferences) return undefined;
    
    const updatedPreferences: UserPreferences = { ...existingPreferences, ...preferences };
    this.userPreferences.set(existingPreferences.id, updatedPreferences);
    return updatedPreferences;
  }
  
  // Cart operations
  async getCartItems(userId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => item.userId === userId);
  }
  
  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists for this user - consider curry option as part of uniqueness
    const existingItem = Array.from(this.cartItems.values()).find(
      item => 
        item.userId === cartItem.userId && 
        item.mealId === cartItem.mealId &&
        // Either both have no curry option or they have the same curry option ID
        ((item.curryOptionId === undefined && cartItem.curryOptionId === undefined) ||
         (item.curryOptionId === cartItem.curryOptionId))
    );
    
    if (existingItem) {
      // Update quantity instead of adding new item
      const updatedItem: CartItem = {
        ...existingItem,
        quantity: existingItem.quantity + cartItem.quantity
      };
      this.cartItems.set(existingItem.id, updatedItem);
      return updatedItem;
    }
    
    const id = this.cartItemId++;
    const newCartItem: CartItem = { ...cartItem, id };
    this.cartItems.set(id, newCartItem);
    return newCartItem;
  }
  
  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined> {
    const existingItem = this.cartItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem: CartItem = { ...existingItem, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async updateCartItem(id: number, updates: Partial<CartItem>): Promise<CartItem | undefined> {
    const existingItem = this.cartItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem: CartItem = { ...existingItem, ...updates };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async removeFromCart(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }
  
  async clearCart(userId: number): Promise<boolean> {
    const userCartItems = Array.from(this.cartItems.values()).filter(item => item.userId === userId);
    userCartItems.forEach(item => this.cartItems.delete(item.id));
    return true;
  }
  
  // Review operations
  async getReviewsByMealId(mealId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => review.mealId === mealId);
  }
  
  async getReviewsByUserId(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => review.userId === userId);
  }
  
  async createReview(review: InsertReview): Promise<Review> {
    const id = this.reviewId++;
    const newReview: Review = { ...review, id, createdAt: new Date() };
    this.reviews.set(id, newReview);
    return newReview;
  }
  
  // Analytics methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getAllOrderItems(): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values());
  }
  
  async getAllSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values());
  }
  
  async getAllReviews(): Promise<Review[]> {
    return Array.from(this.reviews.values());
  }
  
  // Address operations
  async getAddresses(userId: number): Promise<Address[]> {
    return Array.from(this.addresses.values()).filter(address => address.userId === userId);
  }
  
  async getAddressById(id: number): Promise<Address | undefined> {
    return this.addresses.get(id);
  }
  
  async createAddress(address: InsertAddress): Promise<Address> {
    const id = this.addressId++;
    const newAddress: Address = { ...address, id, createdAt: new Date() };
    
    // If this is set as the default address, we need to unset any other default addresses for this user
    if (address.isDefault) {
      const userAddresses = await this.getAddresses(address.userId);
      userAddresses.forEach(addr => {
        if (addr.isDefault) {
          const updated = { ...addr, isDefault: false };
          this.addresses.set(addr.id, updated);
        }
      });
    }
    
    this.addresses.set(id, newAddress);
    return newAddress;
  }
  
  async updateAddress(id: number, address: Partial<Address>): Promise<Address | undefined> {
    const existingAddress = this.addresses.get(id);
    if (!existingAddress) return undefined;
    
    const updatedAddress: Address = { ...existingAddress, ...address };
    
    // If this address is being set as default, unset any other default addresses for this user
    if (address.isDefault && updatedAddress.isDefault) {
      const userAddresses = await this.getAddresses(updatedAddress.userId);
      userAddresses.forEach(addr => {
        if (addr.id !== id && addr.isDefault) {
          const updated = { ...addr, isDefault: false };
          this.addresses.set(addr.id, updated);
        }
      });
    }
    
    this.addresses.set(id, updatedAddress);
    return updatedAddress;
  }
  
  async deleteAddress(id: number): Promise<boolean> {
    return this.addresses.delete(id);
  }
  
  // Curry Option operations
  async getCurryOptions(): Promise<any[]> {
    return Array.from(this.curryOptions.values());
  }
  
  async getCurryOption(id: string): Promise<any | undefined> {
    return this.curryOptions.get(id);
  }
  
  async createCurryOption(curryOption: any): Promise<any> {
    const id = curryOption.id || `curry_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newCurryOption = {
      ...curryOption,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.curryOptions.set(id, newCurryOption);
    return newCurryOption;
  }
  
  async updateCurryOption(id: string, curryOption: any): Promise<any | undefined> {
    if (!this.curryOptions.has(id)) {
      return undefined;
    }
    
    const existingCurryOption = this.curryOptions.get(id);
    const updatedCurryOption = {
      ...existingCurryOption,
      ...curryOption,
      id,
      updatedAt: new Date()
    };
    
    this.curryOptions.set(id, updatedCurryOption);
    return updatedCurryOption;
  }
  
  async deleteCurryOption(id: string): Promise<boolean> {
    return this.curryOptions.delete(id);
  }
}

// Already imported memorystore above, don't reimport

// Remove this class in future updates
export class DatabaseStorage implements IStorage {
  sessionStore: expressSession.Store;
  
  constructor() {
    console.warn('DatabaseStorage is deprecated - use mongoStorage directly');
    const MemoryStore = createMemoryStore(expressSession);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    console.warn('DatabaseStorage is deprecated, use mongoStorage directly');
    return undefined;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    console.warn('DatabaseStorage is deprecated, use mongoStorage directly');
    return { 
      ...user, 
      id: 0, 
      role: 'user', 
      createdAt: new Date() 
    };
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Meal operations
  async getMeal(id: number): Promise<Meal | undefined> {
    const [meal] = await db.select().from(meals).where(eq(meals.id, id));
    return meal;
  }
  
  async getAllMeals(): Promise<Meal[]> {
    return await db.select().from(meals);
  }
  
  async getMealsByType(mealType: string): Promise<Meal[]> {
    return await db.select().from(meals).where(eq(meals.mealType, mealType as any));
  }
  
  async getMealsByDietaryPreference(preference: string): Promise<Meal[]> {
    // Using SQL contains array operator (@>) to check if dietaryPreferences array contains the preference
    return await db.select().from(meals)
      .where(sql`${meals.dietaryPreferences} @> ARRAY[${preference}]::text[]`);
  }
  
  async createMeal(meal: InsertMeal): Promise<Meal> {
    const [newMeal] = await db.insert(meals).values({
      ...meal,
      available: true
    }).returning();
    return newMeal;
  }
  
  async updateMeal(id: number, mealData: Partial<Meal>): Promise<Meal | undefined> {
    const [updatedMeal] = await db
      .update(meals)
      .set(mealData)
      .where(eq(meals.id, id))
      .returning();
    return updatedMeal;
  }
  
  // Subscription operations
  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }
  
  async getSubscriptionsByUserId(userId: number): Promise<Subscription[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  }
  
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }
  
  async updateSubscription(id: number, subscriptionData: Partial<Subscription>): Promise<Subscription | undefined> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }
  
  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions);
  }
  
  // Custom Meal Plan operations
  async getCustomMealPlans(subscriptionId: number): Promise<CustomMealPlan[]> {
    return await db.select().from(customMealPlans).where(eq(customMealPlans.subscriptionId, subscriptionId));
  }
  
  async createCustomMealPlan(customMealPlan: InsertCustomMealPlan): Promise<CustomMealPlan> {
    const [newCustomMealPlan] = await db.insert(customMealPlans).values(customMealPlan).returning();
    return newCustomMealPlan;
  }
  
  async deleteCustomMealPlan(id: number): Promise<boolean> {
    const result = await db.delete(customMealPlans).where(eq(customMealPlans.id, id));
    return result.rowCount > 0;
  }
  
  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
  
  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values({
      ...order,
      status: 'pending',
      createdAt: new Date()
    }).returning();
    return newOrder;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status: status as any })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }
  
  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }
  
  // Order Item operations
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }
  
  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }
  
  async getAllOrderItems(): Promise<OrderItem[]> {
    return await db.select().from(orderItems);
  }
  
  // User Preferences operations
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return preferences;
  }
  
  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [newPreferences] = await db.insert(userPreferences).values(preferences).returning();
    return newPreferences;
  }
  
  async updateUserPreferences(userId: number, preferenceData: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const [updatedPreferences] = await db
      .update(userPreferences)
      .set(preferenceData)
      .where(eq(userPreferences.userId, userId))
      .returning();
    return updatedPreferences;
  }
  
  // Cart operations
  async getCartItems(userId: number): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  }
  
  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item with same meal and curry option already exists
    if (cartItem.curryOptionId) {
      const [existingItem] = await db.select().from(cartItems).where(
        and(
          eq(cartItems.userId, cartItem.userId),
          eq(cartItems.mealId, cartItem.mealId),
          eq(cartItems.curryOptionId, cartItem.curryOptionId)
        )
      );
      
      if (existingItem) {
        // Update quantity of existing item
        const [updatedItem] = await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + cartItem.quantity })
          .where(eq(cartItems.id, existingItem.id))
          .returning();
        return updatedItem;
      }
    }
    
    // Otherwise, create a new cart item
    const [newCartItem] = await db.insert(cartItems).values(cartItem).returning();
    return newCartItem;
  }
  
  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }
  
  async updateCartItem(id: number, updates: Partial<CartItem>): Promise<CartItem | undefined> {
    const [updatedItem] = await db
      .update(cartItems)
      .set(updates)
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }
  
  async removeFromCart(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return result.rowCount > 0;
  }
  
  async clearCart(userId: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return true; // Always return true even if no items were deleted
  }
  
  // Review operations
  async getReviewsByMealId(mealId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.mealId, mealId));
  }
  
  async getReviewsByUserId(userId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.userId, userId));
  }
  
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values({
      ...review,
      createdAt: new Date()
    }).returning();
    return newReview;
  }
  
  async getAllReviews(): Promise<Review[]> {
    return await db.select().from(reviews);
  }

  // Address operations
  async getAddresses(userId: number): Promise<Address[]> {
    return await db.select().from(addresses).where(eq(addresses.userId, userId));
  }
  
  async getAddressById(id: number): Promise<Address | undefined> {
    const [address] = await db.select().from(addresses).where(eq(addresses.id, id));
    return address;
  }
  
  async createAddress(address: InsertAddress): Promise<Address> {
    // If this is set as the default address, unset any other default addresses for this user
    if (address.isDefault) {
      await db.update(addresses)
        .set({ isDefault: false })
        .where(and(
          eq(addresses.userId, address.userId), 
          eq(addresses.isDefault, true)
        ));
    }
    
    const [newAddress] = await db.insert(addresses)
      .values({
        ...address,
        createdAt: new Date()
      })
      .returning();
      
    return newAddress;
  }
  
  async updateAddress(id: number, address: Partial<Address>): Promise<Address | undefined> {
    // If this address is being set as default, unset any other default addresses for this user
    if (address.isDefault) {
      const [existingAddress] = await db.select().from(addresses).where(eq(addresses.id, id));
      if (existingAddress) {
        await db.update(addresses)
          .set({ isDefault: false })
          .where(and(
            eq(addresses.userId, existingAddress.userId),
            eq(addresses.isDefault, true),
            sql`${addresses.id} != ${id}`
          ));
      }
    }
    
    const [updatedAddress] = await db.update(addresses)
      .set(address)
      .where(eq(addresses.id, id))
      .returning();
      
    return updatedAddress;
  }
  
  async deleteAddress(id: number): Promise<boolean> {
    const result = await db.delete(addresses).where(eq(addresses.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Curry Option operations - using MongoDB directly
  async getCurryOptions(): Promise<any[]> {
    try {
      return await CurryOption.find().lean();
    } catch (error) {
      console.error('Error getting curry options:', error);
      return [];
    }
  }
  
  async getCurryOption(id: string): Promise<any | undefined> {
    try {
      const curryOption = await CurryOption.findOne({ id }).lean();
      return curryOption || undefined;
    } catch (error) {
      console.error('Error getting curry option:', error);
      return undefined;
    }
  }
  
  async createCurryOption(curryOptionData: any): Promise<any> {
    try {
      const newCurryOption = new CurryOption(curryOptionData);
      await newCurryOption.save();
      return newCurryOption.toObject();
    } catch (error) {
      console.error('Error creating curry option:', error);
      throw error;
    }
  }
  
  async updateCurryOption(id: string, updateData: any): Promise<any | undefined> {
    try {
      const updatedCurryOption = await CurryOption.findOneAndUpdate(
        { id },
        { ...updateData, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      return updatedCurryOption || undefined;
    } catch (error) {
      console.error('Error updating curry option:', error);
      return undefined;
    }
  }
  
  async deleteCurryOption(id: string): Promise<boolean> {
    try {
      const result = await CurryOption.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting curry option:', error);
      return false;
    }
  }
}

// Initialize storage with MongoDB, but have MemStorage as fallback

// Declare global for type safety
declare global {
  var useMemoryFallback: boolean;
}

// Create a fallback memory storage instance
const memStorage = new MemStorage();

// Export the appropriate storage based on the global flag
const dbStorage = new DatabaseStorage();
let defaultStorage: IStorage = dbStorage;

// Let other modules change the storage implementation
export function createFallbackStorage(): IStorage {
  console.log('Activating fallback in-memory storage');
  defaultStorage = memStorage;
  return memStorage;
}

// Export a proxy to the current storage implementation
export const storage = new Proxy({} as IStorage, {
  get: (target, prop) => {
    // Always get the latest storage implementation
    return global.useMemoryFallback 
      ? memStorage[prop as keyof IStorage]
      : dbStorage[prop as keyof IStorage];
  }
});
