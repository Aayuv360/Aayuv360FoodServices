import {
  users, meals, subscriptions, orders, orderItems, userPreferences, cartItems, reviews, customMealPlans,
  type User, type InsertUser, type Meal, type InsertMeal,
  type Subscription, type InsertSubscription, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type CartItem, type InsertCartItem,
  type UserPreferences, type InsertUserPreferences, type Review, type InsertReview,
  type CustomMealPlan, type InsertCustomMealPlan
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
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
  
  // Custom Meal Plan operations
  getCustomMealPlans(subscriptionId: number): Promise<CustomMealPlan[]>;
  createCustomMealPlan(customMealPlan: InsertCustomMealPlan): Promise<CustomMealPlan>;
  deleteCustomMealPlan(id: number): Promise<boolean>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Order Item operations
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // User Preferences operations
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences | undefined>;
  
  // Cart operations
  getCartItems(userId: number): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;
  
  // Review operations
  getReviewsByMealId(mealId: number): Promise<Review[]>;
  getReviewsByUserId(userId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
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
    const sampleMeals: InsertMeal[] = [
      {
        name: "Millet Dosa with Sambar",
        description: "A crispy South Indian crepe made with fermented millet batter, served with lentil soup and chutney.",
        price: 18000, // ₹180
        imageUrl: "https://images.unsplash.com/photo-1631292784641-43e566b5a352",
        calories: 280,
        protein: 12,
        carbs: 42,
        fat: 6,
        fiber: 8,
        sugar: 3,
        mealType: "breakfast",
        isPopular: true,
        dietaryPreferences: ["vegetarian", "gluten-free"],
        allergens: [],
      },
      {
        name: "Millet Biryani",
        description: "Traditional Hyderabadi biryani made with foxtail millet, aromatic spices, and seasonal vegetables.",
        price: 22000, // ₹220
        imageUrl: "https://images.unsplash.com/photo-1624291649578-5a1580e7426c",
        calories: 350,
        protein: 15,
        carbs: 45,
        fat: 8,
        fiber: 10,
        sugar: 2,
        mealType: "lunch",
        dietaryPreferences: ["vegetarian", "high-protein"],
        allergens: [],
      },
      {
        name: "Ragi Mudde with Curry",
        description: "Finger millet balls served with a flavorful vegetable curry, a traditional dish rich in calcium and fiber.",
        price: 19000, // ₹190
        imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47",
        calories: 320,
        protein: 14,
        carbs: 40,
        fat: 7,
        fiber: 12,
        sugar: 4,
        mealType: "dinner",
        isNew: true,
        dietaryPreferences: ["vegetarian", "gluten-free", "spicy"],
        allergens: [],
      },
      {
        name: "Kodo Millet Pulao",
        description: "A fragrant rice dish made with kodo millet, vegetables, and Hyderabadi spices.",
        price: 18500, // ₹185
        imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107aa3c107",
        calories: 310,
        protein: 11,
        carbs: 45,
        fat: 6,
        fiber: 9,
        sugar: 3,
        mealType: "lunch",
        dietaryPreferences: ["vegetarian", "gluten-free"],
        allergens: [],
      },
      {
        name: "Jowar Roti with Dal",
        description: "Sorghum flatbread served with a protein-rich lentil curry and vegetable side.",
        price: 16000, // ₹160
        imageUrl: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40",
        calories: 290,
        protein: 16,
        carbs: 38,
        fat: 5,
        fiber: 11,
        sugar: 2,
        mealType: "dinner",
        dietaryPreferences: ["vegetarian", "high-protein"],
        allergens: [],
      },
      {
        name: "Barnyard Millet Pongal",
        description: "A comforting savory porridge made with barnyard millet, lentils, and tempering of spices.",
        price: 17000, // ₹170
        imageUrl: "https://images.unsplash.com/photo-1553531889-56cc480ac5cb",
        calories: 270,
        protein: 13,
        carbs: 36,
        fat: 7,
        fiber: 8,
        sugar: 2,
        mealType: "breakfast",
        dietaryPreferences: ["vegetarian", "low-carb"],
        allergens: [],
      },
      {
        name: "Little Millet Upma",
        description: "A savory breakfast dish made with little millet, vegetables, and South Indian spices.",
        price: 15000, // ₹150
        imageUrl: "https://images.unsplash.com/photo-1593001872095-7d5b3868dd2b",
        calories: 250,
        protein: 10,
        carbs: 35,
        fat: 6,
        fiber: 7,
        sugar: 3,
        mealType: "breakfast",
        dietaryPreferences: ["vegetarian"],
        allergens: [],
      },
      {
        name: "Pearl Millet Khichdi",
        description: "A wholesome one-pot meal made with pearl millet, lentils, and mixed vegetables.",
        price: 17500, // ₹175
        imageUrl: "https://images.unsplash.com/photo-1546549032-9571cd6b27df",
        calories: 300,
        protein: 14,
        carbs: 40,
        fat: 7,
        fiber: 9,
        sugar: 2,
        mealType: "dinner",
        isPopular: true,
        dietaryPreferences: ["vegetarian", "high-protein"],
        allergens: [],
      },
      {
        name: "Foxtail Millet Idli",
        description: "Steamed fermented cakes made with foxtail millet, served with chutney and sambar.",
        price: 16000, // ₹160
        imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f86762e1",
        calories: 240,
        protein: 9,
        carbs: 33,
        fat: 5,
        fiber: 7,
        sugar: 1,
        mealType: "breakfast",
        dietaryPreferences: ["vegetarian", "gluten-free"],
        allergens: [],
      },
      {
        name: "Proso Millet Payasam",
        description: "A traditional sweet dessert made with proso millet, milk, and jaggery.",
        price: 14000, // ₹140
        imageUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b",
        calories: 280,
        protein: 8,
        carbs: 45,
        fat: 9,
        fiber: 5,
        sugar: 22,
        mealType: "dinner",
        isNew: true,
        dietaryPreferences: ["vegetarian"],
        allergens: ["milk"],
      }
    ];
    
    sampleMeals.forEach(meal => this.createMeal(meal));
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
    // Check if item already exists for this user
    const existingItem = Array.from(this.cartItems.values()).find(
      item => item.userId === cartItem.userId && item.mealId === cartItem.mealId
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
}

export const storage = new MemStorage();
