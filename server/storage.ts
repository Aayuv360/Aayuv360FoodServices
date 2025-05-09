import {
  users, meals, subscriptions, orders, orderItems, userPreferences, cartItems, reviews, customMealPlans,
  type User, type InsertUser, type Meal, type InsertMeal,
  type Subscription, type InsertSubscription, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type CartItem, type InsertCartItem,
  type UserPreferences, type InsertUserPreferences, type Review, type InsertReview,
  type CustomMealPlan, type InsertCustomMealPlan
} from "@shared/schema";
import { milletMeals } from "./mealItems";

export interface IStorage {
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
}

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
  
  private userId: number;
  private mealId: number;
  private subscriptionId: number;
  private customMealPlanId: number;
  private orderId: number;
  private orderItemId: number;
  private userPreferencesId: number;
  private cartItemId: number;
  private reviewId: number;
  
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
    
    this.userId = 1;
    this.mealId = 1;
    this.subscriptionId = 1;
    this.customMealPlanId = 1;
    this.orderId = 1;
    this.orderItemId = 1;
    this.userPreferencesId = 1;
    this.cartItemId = 1;
    this.reviewId = 1;
    
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
}

export const storage = new MemStorage();
