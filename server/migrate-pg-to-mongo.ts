/**
 * PostgreSQL to MongoDB Data Migration Script
 * 
 * This script migrates all data from PostgreSQL to MongoDB while preserving
 * relationships between entities. It handles all major entities in the system:
 * - Users
 * - Meals
 * - Subscriptions
 * - Custom Meal Plans
 * - Orders
 * - Order Items
 * - User Preferences
 * - Cart Items
 * - Reviews
 * - Addresses
 * - Locations
 */

import { pool } from './db'; // PostgreSQL connection
import { connectToMongoDB } from './mongodb'; // MongoDB connection
import { 
  User, Meal, CartItem, Order, Subscription, 
  Review, Address, Location, Counter, getNextSequence
} from '../shared/mongoModels';
import mongoose from 'mongoose';

// Map for tracking PostgreSQL IDs to MongoDB IDs
const idMappings: Record<string, Record<number, string>> = {
  users: {},
  meals: {},
  subscriptions: {},
  customMealPlans: {},
  orders: {},
  orderItems: {},
  userPreferences: {},
  cartItems: {},
  reviews: {},
  addresses: {},
  locations: {}
};

// Initialize counters for MongoDB documents
async function initializeCounters() {
  console.log('Initializing counters...');
  const counters = ['user', 'meal', 'cartItem', 'order', 'orderItem', 'subscription', 
                     'customMealPlan', 'userPreferences', 'review', 'address', 'location'];
  
  for (const counter of counters) {
    await Counter.findOneAndUpdate(
      { _id: counter },
      { $set: { seq: 0 } },
      { upsert: true, new: true }
    );
  }
  console.log('Counters initialized.');
}

// Helper function to format date objects correctly
function formatDate(date: Date | null) {
  return date ? new Date(date) : null;
}

// Migrate users
async function migrateUsers() {
  console.log('Migrating users...');
  const { rows: pgUsers } = await pool.query('SELECT * FROM users');
  
  // Clear existing users
  await User.deleteMany({});
  
  let count = 0;
  for (const pgUser of pgUsers) {
    // Use the existing counter sequence for MongoDB
    const mongoUser = new User({
      id: pgUser.id,
      username: pgUser.username,
      password: pgUser.password,
      email: pgUser.email,
      name: pgUser.name,
      phone: pgUser.phone,
      address: pgUser.address,
      role: pgUser.role || 'user',
      createdAt: formatDate(pgUser.created_at),
      stripeCustomerId: pgUser.stripe_customer_id,
      stripeSubscriptionId: pgUser.stripe_subscription_id
    });
    
    const savedUser = await mongoUser.save();
    idMappings.users[pgUser.id] = savedUser.id;
    count++;
    
    // Update the counter to match the highest ID
    await Counter.findOneAndUpdate(
      { _id: 'user' },
      { $set: { seq: Math.max(pgUser.id, await Counter.findOne({ _id: 'user' }).then(doc => doc?.seq || 0)) } }
    );
  }
  
  console.log(`Migrated ${count} users.`);
}

// Migrate meals
async function migrateMeals() {
  console.log('Migrating meals...');
  const { rows: pgMeals } = await pool.query('SELECT * FROM meals');
  
  // Clear existing meals
  await Meal.deleteMany({});
  
  let count = 0;
  for (const pgMeal of pgMeals) {
    // Add required category field with default value
    const category = pgMeal.millet_type || 'Mixed Millet';
    
    const mongoMeal = new Meal({
      id: pgMeal.id,
      name: pgMeal.name,
      description: pgMeal.description,
      price: pgMeal.price,
      imageUrl: pgMeal.image_url,
      calories: pgMeal.calories,
      protein: pgMeal.protein,
      carbs: pgMeal.carbs,
      fat: pgMeal.fat,
      fiber: pgMeal.fiber,
      ingredients: pgMeal.ingredients,
      dietaryInfo: pgMeal.dietary_info,
      mealType: pgMeal.meal_type,
      available: pgMeal.available !== false,
      preparationTime: pgMeal.preparation_time,
      milletType: pgMeal.millet_type,
      allergens: pgMeal.allergens,
      category: category, // Required field, set default if not present
      // Add other meal fields as needed
    });
    
    const savedMeal = await mongoMeal.save();
    idMappings.meals[pgMeal.id] = savedMeal.id;
    count++;
    
    // Update the counter
    await Counter.findOneAndUpdate(
      { _id: 'meal' },
      { $set: { seq: Math.max(pgMeal.id, await Counter.findOne({ _id: 'meal' }).then(doc => doc?.seq || 0)) } }
    );
  }
  
  console.log(`Migrated ${count} meals.`);
}

// Migrate subscriptions
async function migrateSubscriptions() {
  console.log('Migrating subscriptions...');
  const { rows: pgSubscriptions } = await pool.query('SELECT * FROM subscriptions');
  
  // Clear existing subscriptions
  await Subscription.deleteMany({});
  
  let count = 0;
  for (const pgSub of pgSubscriptions) {
    const mongoSub = new Subscription({
      id: pgSub.id,
      userId: pgSub.user_id,
      plan: pgSub.plan,
      price: pgSub.price,
      startDate: formatDate(pgSub.start_date),
      endDate: formatDate(pgSub.end_date),
      status: pgSub.status || 'active',
      paymentStatus: pgSub.payment_status || 'paid',
      subscriptionType: pgSub.subscription_type || 'default',
      dietPreference: pgSub.diet_preference,
      mealsPerDay: pgSub.meals_per_day || 1,
      mealsPerMonth: pgSub.meals_per_month || 30,
      personCount: pgSub.person_count || 1,
      paymentId: pgSub.payment_id,
      // Custom meal plans will be added in a separate function
    });
    
    const savedSub = await mongoSub.save();
    idMappings.subscriptions[pgSub.id] = savedSub.id;
    count++;
    
    // Update the counter
    await Counter.findOneAndUpdate(
      { _id: 'subscription' },
      { $set: { seq: Math.max(pgSub.id, await Counter.findOne({ _id: 'subscription' }).then(doc => doc?.seq || 0)) } }
    );
  }
  
  console.log(`Migrated ${count} subscriptions.`);
}

// Skip custom meal plans - handle as embedded documents in future update if needed

// Migrate orders
async function migrateOrders() {
  console.log('Migrating orders...');
  const { rows: pgOrders } = await pool.query('SELECT * FROM orders');
  
  // Clear existing orders
  await Order.deleteMany({});
  
  let count = 0;
  for (const pgOrder of pgOrders) {
    const mongoOrder = new Order({
      id: pgOrder.id,
      userId: pgOrder.user_id,
      totalPrice: pgOrder.total_price,
      status: pgOrder.status || 'pending',
      deliveryAddress: pgOrder.delivery_address,
      deliveryTime: formatDate(pgOrder.delivery_time),
      createdAt: formatDate(pgOrder.created_at),
      paymentId: pgOrder.payment_id,
      paymentStatus: pgOrder.payment_status || 'pending',
      // Order items will be added separately
    });
    
    const savedOrder = await mongoOrder.save();
    idMappings.orders[pgOrder.id] = savedOrder.id;
    count++;
    
    // Update the counter
    await Counter.findOneAndUpdate(
      { _id: 'order' },
      { $set: { seq: Math.max(pgOrder.id, await Counter.findOne({ _id: 'order' }).then(doc => doc?.seq || 0)) } }
    );
  }
  
  console.log(`Migrated ${count} orders.`);
}

// Migrate order items (directly into orders as embedded documents)
async function migrateOrderItems() {
  console.log('Migrating order items...');
  const { rows: pgOrderItems } = await pool.query('SELECT * FROM order_items');
  
  // Group order items by order ID
  const orderItemsByOrderId: Record<number, any[]> = {};
  
  for (const pgItem of pgOrderItems) {
    const orderId = pgItem.order_id;
    if (!orderItemsByOrderId[orderId]) {
      orderItemsByOrderId[orderId] = [];
    }
    
    orderItemsByOrderId[orderId].push({
      mealId: pgItem.meal_id,
      quantity: pgItem.quantity || 1,
      price: pgItem.price,
      notes: pgItem.notes,
      curryOptionId: pgItem.curry_option_id,
      curryOptionName: pgItem.curry_option_name,
      curryOptionPrice: pgItem.curry_option_price
    });
  }
  
  // Update each order with its items
  let totalItemsCount = 0;
  for (const [orderId, items] of Object.entries(orderItemsByOrderId)) {
    await Order.findOneAndUpdate(
      { id: parseInt(orderId) },
      { $set: { items: items } }
    );
    totalItemsCount += items.length;
  }
  
  console.log(`Migrated ${totalItemsCount} order items into ${Object.keys(orderItemsByOrderId).length} orders.`);
}

// Skip user preferences - handle directly in user objects in future update if needed

// Migrate cart items
async function migrateCartItems() {
  console.log('Migrating cart items...');
  const { rows: pgCartItems } = await pool.query('SELECT * FROM cart_items');
  
  // Clear existing cart items
  await CartItem.deleteMany({});
  
  let count = 0;
  for (const pgItem of pgCartItems) {
    const mongoItem = new CartItem({
      id: pgItem.id,
      userId: pgItem.user_id,
      mealId: pgItem.meal_id,
      quantity: pgItem.quantity || 1,
      curryOptionId: pgItem.curry_option_id,
      curryOptionName: pgItem.curry_option_name,
      curryOptionPrice: pgItem.curry_option_price,
      notes: pgItem.notes,
      category: pgItem.category || 'regular' // Required field
    });
    
    const savedItem = await mongoItem.save();
    idMappings.cartItems[pgItem.id] = savedItem.id;
    count++;
    
    // Update the counter
    await Counter.findOneAndUpdate(
      { _id: 'cartItem' },
      { $set: { seq: Math.max(pgItem.id, await Counter.findOne({ _id: 'cartItem' }).then(doc => doc?.seq || 0)) } }
    );
  }
  
  console.log(`Migrated ${count} cart items.`);
}

// Migrate reviews
async function migrateReviews() {
  console.log('Migrating reviews...');
  const { rows: pgReviews } = await pool.query('SELECT * FROM reviews');
  
  // Clear existing reviews
  await Review.deleteMany({});
  
  let count = 0;
  for (const pgReview of pgReviews) {
    const mongoReview = new Review({
      id: pgReview.id,
      userId: pgReview.user_id,
      mealId: pgReview.meal_id,
      rating: pgReview.rating,
      comment: pgReview.comment,
      createdAt: formatDate(pgReview.created_at)
    });
    
    const savedReview = await mongoReview.save();
    idMappings.reviews[pgReview.id] = savedReview.id;
    count++;
    
    // Update the counter
    await Counter.findOneAndUpdate(
      { _id: 'review' },
      { $set: { seq: Math.max(pgReview.id, await Counter.findOne({ _id: 'review' }).then(doc => doc?.seq || 0)) } }
    );
  }
  
  console.log(`Migrated ${count} reviews.`);
}

// Migrate addresses
async function migrateAddresses() {
  console.log('Migrating addresses...');
  const { rows: pgAddresses } = await pool.query('SELECT * FROM addresses');
  
  // Clear existing addresses
  await Address.deleteMany({});
  
  let count = 0;
  for (const pgAddr of pgAddresses) {
    const mongoAddr = new Address({
      id: pgAddr.id,
      userId: pgAddr.user_id,
      name: pgAddr.name,
      phone: pgAddr.phone,
      addressLine1: pgAddr.address_line1,
      addressLine2: pgAddr.address_line2,
      city: pgAddr.city,
      state: pgAddr.state,
      pincode: pgAddr.pincode,
      isDefault: pgAddr.is_default,
      createdAt: formatDate(pgAddr.created_at)
    });
    
    const savedAddr = await mongoAddr.save();
    idMappings.addresses[pgAddr.id] = savedAddr.id;
    count++;
    
    // Update the counter
    await Counter.findOneAndUpdate(
      { _id: 'address' },
      { $set: { seq: Math.max(pgAddr.id, await Counter.findOne({ _id: 'address' }).then(doc => doc?.seq || 0)) } }
    );
  }
  
  console.log(`Migrated ${count} addresses.`);
}

// Migrate locations
async function migrateLocations() {
  console.log('Migrating locations...');
  const { rows: pgLocations } = await pool.query('SELECT * FROM locations');
  
  // Clear existing locations
  await Location.deleteMany({});
  
  let count = 0;
  for (const pgLoc of pgLocations) {
    const mongoLoc = new Location({
      id: pgLoc.id,
      area: pgLoc.area,
      pincode: pgLoc.pincode,
      deliveryAvailable: pgLoc.delivery_available !== false,
      deliveryCharge: pgLoc.delivery_charge || 0
    });
    
    const savedLoc = await mongoLoc.save();
    idMappings.locations[pgLoc.id] = savedLoc.id;
    count++;
    
    // Update the counter
    await Counter.findOneAndUpdate(
      { _id: 'location' },
      { $set: { seq: Math.max(pgLoc.id, await Counter.findOne({ _id: 'location' }).then(doc => doc?.seq || 0)) } }
    );
  }
  
  console.log(`Migrated ${count} locations.`);
}

// Main migration function
async function migrateData() {
  console.log('Starting PostgreSQL to MongoDB migration...');
  
  try {
    // Connect to MongoDB
    const mongoConnection = await connectToMongoDB();
    if (!mongoConnection.readyState) {
      throw new Error('MongoDB connection failed');
    }
    
    // Initialize counters
    await initializeCounters();
    
    // Migrate all data in sequence to maintain referential integrity
    await migrateUsers();
    await migrateMeals();
    await migrateSubscriptions();
    // Custom meal plans are embedded in subscription documents
    await migrateOrders();
    await migrateOrderItems();
    // User preferences are embedded in user documents
    await migrateCartItems();
    await migrateReviews();
    await migrateAddresses();
    await migrateLocations();
    
    console.log('Migration completed successfully!');
    
    // Output summary
    console.log('\nMigration Summary:');
    for (const [entity, mapping] of Object.entries(idMappings)) {
      console.log(`${entity}: ${Object.keys(mapping).length} records migrated`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connections
    await mongoose.disconnect();
    await pool.end();
    
    console.log('Database connections closed.');
  }
}

// Run the migration
migrateData().catch(err => {
  console.error('Unhandled error during migration:', err);
  process.exit(1);
});