import {
  User,
  Meal,
  CartItem,
  Order,
  Subscription,
  Address,
  Location,
  Review,
  CurryOption,
  getNextSequence,
} from "../shared/mongoModels";
import { createSessionStore } from "./session-store";
import expressSession from "express-session";
import { milletMeals, MealDataItem } from "./mealData";

import { IStorage } from "./storage";

export class MongoDBStorage implements IStorage {
  sessionStore: expressSession.Store;

  constructor() {
    this.sessionStore = createSessionStore();

    setTimeout(() => {
      this.initializeSampleMeals().catch((err) =>
        console.error("Error initializing sample meals:", err),
      );
    }, 2000);
  }

  private async initializeSampleMeals(): Promise<void> {
    try {
      let mealsCount;

      try {
        console.log("Fetching meal count from database...");
        mealsCount = await Meal.countDocuments();
        console.log(`Found ${mealsCount} meals in the database`);
      } catch (err) {
        console.error("Error counting meals:", err);
        console.log(
          "Skipping meal initialization due to database connection issues",
        );
        return; // Exit early if we can't connect to the database
      }

      if (mealsCount === 0) {
        console.log("Initializing sample meals...");

        // Prepare meal items with required category field
        const preparedMeals = milletMeals.map((meal: MealDataItem) => {
          // Extract category from milletType or use a default
          if (!meal.category) {
            if (
              meal.mealType?.toLowerCase().includes("ragi") ||
              meal.name?.toLowerCase().includes("ragi")
            ) {
              meal.category = "Finger Millet";
            } else if (
              meal.mealType?.toLowerCase().includes("jowar") ||
              meal.name?.toLowerCase().includes("jowar")
            ) {
              meal.category = "Sorghum";
            } else if (
              meal.mealType?.toLowerCase().includes("bajra") ||
              meal.name?.toLowerCase().includes("bajra")
            ) {
              meal.category = "Pearl Millet";
            } else if (
              meal.mealType?.toLowerCase().includes("foxtail") ||
              meal.name?.toLowerCase().includes("foxtail")
            ) {
              meal.category = "Foxtail Millet";
            } else if (
              meal.mealType?.toLowerCase().includes("kodo") ||
              meal.name?.toLowerCase().includes("kodo")
            ) {
              meal.category = "Kodo Millet";
            } else {
              meal.category = "Mixed Millet";
            }
          }
          return meal;
        });

        // Process in batches to avoid overwhelming the database
        const batchSize = 5;
        for (let i = 0; i < preparedMeals.length; i += batchSize) {
          const batch = preparedMeals.slice(i, i + batchSize);
          await Promise.all(
            batch.map((meal: MealDataItem) => {
              return this.createMeal(meal).catch((err) => {
                console.error(`Failed to create meal ${meal.name}:`, err);
                return null;
              });
            }),
          );
          console.log(
            `Initialized meals batch ${i / batchSize + 1}/${Math.ceil(preparedMeals.length / batchSize)}`,
          );
        }

        console.log(`Initialized sample meals`);
      } else if (mealsCount === -1) {
        console.log(
          "Skipping meal initialization due to database connectivity issues",
        );
      } else {
        console.log(
          `Skipping meal initialization, found ${mealsCount} existing meals`,
        );
      }
    } catch (error) {
      console.error("Error initializing sample meals:", error);
    }
  }

  async getUser(id: number): Promise<any | undefined> {
    try {
      const user = await User.findOne({ id });
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    try {
      const user = await User.findOne({ username });
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    try {
      const user = await User.findOne({ email });
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }

  async updateUser(id: number, userData: any): Promise<any | undefined> {
    try {
      const user = await User.findOneAndUpdate(
        { id },
        {
          ...userData,
          updatedAt: new Date(),
        },
        { new: true },
      );
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const users = await User.find();
      return users.map((user) => user.toObject());
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  async createUser(userData: any): Promise<any> {
    try {
      const id = await getNextSequence("user");
      const newUser = new User({
        ...userData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await newUser.save();
      return newUser.toObject();
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateStripeCustomerId(
    userId: number,
    customerId: string,
  ): Promise<any> {
    try {
      const user = await User.findOneAndUpdate(
        { id: userId },
        {
          stripeCustomerId: customerId,
          updatedAt: new Date(),
        },
        { new: true },
      );
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error("Error updating stripe customer ID:", error);
      throw error;
    }
  }

  async updateUserStripeInfo(
    userId: number,
    stripeInfo: { stripeCustomerId: string; stripeSubscriptionId: string },
  ): Promise<any> {
    try {
      const user = await User.findOneAndUpdate(
        { id: userId },
        {
          stripeCustomerId: stripeInfo.stripeCustomerId,
          stripeSubscriptionId: stripeInfo.stripeSubscriptionId,
          updatedAt: new Date(),
        },
        { new: true },
      );
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error("Error updating user stripe info:", error);
      throw error;
    }
  }

  // Meal operations
  async getAllMeals(): Promise<any[]> {
    try {
      const meals = await Meal.find().sort({ category: 1 });
      return meals.map((meal) => meal.toObject());
    } catch (error) {
      console.error("Error getting all meals:", error);
      throw error;
    }
  }

  async getMealsByType(mealType: string): Promise<any[]> {
    try {
      const meals = await Meal.find({ mealType }).sort({ name: 1 });
      return meals.map((meal) => meal.toObject());
    } catch (error) {
      console.error("Error getting meals by type:", error);
      throw error;
    }
  }

  async getMealsByDietaryPreference(preference: string): Promise<any[]> {
    try {
      const meals = await Meal.find({ dietaryPreferences: preference }).sort({
        name: 1,
      });
      return meals.map((meal) => meal.toObject());
    } catch (error) {
      console.error("Error getting meals by dietary preference:", error);
      throw error;
    }
  }

  async getMeal(id: number): Promise<any | undefined> {
    try {
      const meal = await Meal.findOne({ id });
      return meal ? meal.toObject() : undefined;
    } catch (error) {
      console.error("Error getting meal:", error);
      throw error;
    }
  }

  async createMeal(mealData: any): Promise<any> {
    try {
      const id = await getNextSequence("meal");
      const newMeal = new Meal({
        ...mealData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await newMeal.save();
      return newMeal.toObject();
    } catch (error) {
      console.error("Error creating meal:", error);
      throw error;
    }
  }

  async updateMeal(id: number, mealData: any): Promise<any | undefined> {
    try {
      const meal = await Meal.findOneAndUpdate(
        { id },
        {
          ...mealData,
          updatedAt: new Date(),
        },
        { new: true },
      );
      return meal ? meal.toObject() : undefined;
    } catch (error) {
      console.error("Error updating meal:", error);
      throw error;
    }
  }

  // Cart operations
  async getCartItems(userId: number): Promise<any[]> {
    try {
      const cartItems = await CartItem.find({ userId });
      const items = cartItems.map((item) => item.toObject());

      // Populate meals data
      const populatedItems = await Promise.all(
        items.map(async (item) => {
          const meal = await this.getMeal(item.mealId);

          // Add curry option to meal if it exists in cart item
          let enrichedMeal = meal;
          if (item.curryOptionId && item.curryOptionName) {
            enrichedMeal = {
              ...meal,
              curryOption: {
                id: item.curryOptionId,
                name: item.curryOptionName,
                priceAdjustment: item.curryOptionPrice || 0,
              },
              // Ensure curryOptions from meal are preserved
              curryOptions: item.curryOptions || meal?.curryOptions || [],
            };
          }

          return {
            ...item,
            meal: enrichedMeal,
          };
        }),
      );

      return populatedItems;
    } catch (error) {
      console.error("Error getting cart items:", error);
      throw error;
    }
  }

  async getCartItem(id: number): Promise<any | undefined> {
    try {
      const cartItem = await CartItem.findOne({ id });
      return cartItem ? cartItem.toObject() : undefined;
    } catch (error) {
      console.error("Error getting cart item:", error);
      throw error;
    }
  }

  async createCartItem(cartItemData: any): Promise<any> {
    try {
      const id = await getNextSequence("cartItem");
      const newCartItem = new CartItem({
        ...cartItemData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await newCartItem.save();

      // Return with populated meal
      const createdItem = newCartItem.toObject();
      const meal = await this.getMeal(createdItem.mealId);
      return {
        ...createdItem,
        meal,
      };
    } catch (error) {
      console.error("Error creating cart item:", error);
      throw error;
    }
  }

  async updateCartItem(id: number, updateData: any): Promise<any | undefined> {
    try {
      const cartItem = await CartItem.findOneAndUpdate(
        { id },
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (!cartItem) return undefined;

      // Return with populated meal
      const updatedItem = cartItem.toObject();
      const meal = await this.getMeal(updatedItem.mealId);
      return {
        ...updatedItem,
        meal,
      };
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    }
  }

  async deleteCartItem(id: number): Promise<boolean> {
    try {
      const result = await CartItem.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting cart item:", error);
      throw error;
    }
  }

  async clearCart(userId: number): Promise<boolean> {
    try {
      const result = await CartItem.deleteMany({ userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  }

  // Order operations
  async createOrder(orderData: any): Promise<any> {
    try {
      const id = await getNextSequence("order");
      const newOrder = new Order({
        ...orderData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await newOrder.save();
      return newOrder.toObject();
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async getOrder(id: number): Promise<any | undefined> {
    try {
      const order = await Order.findOne({ id });
      if (!order) return undefined;

      // Populate items with meals
      const orderObj = order.toObject();
      const populatedItems = await Promise.all(
        orderObj.items.map(async (item: any) => {
          const meal = await this.getMeal(item.mealId);
          return {
            ...item,
            meal,
          };
        }),
      );

      return {
        ...orderObj,
        items: populatedItems,
      };
    } catch (error) {
      console.error("Error getting order:", error);
      throw error;
    }
  }

  async getUserOrders(userId: number): Promise<any[]> {
    try {
      const orders = await Order.find({ userId }).sort({ createdAt: -1 });
      const ordersList = orders.map((order) => order.toObject());

      // Populate items with meals
      const populatedOrders = await Promise.all(
        ordersList.map(async (order) => {
          const populatedItems = await Promise.all(
            order.items.map(async (item: any) => {
              const meal = await this.getMeal(item.mealId);
              return {
                ...item,
                meal,
              };
            }),
          );

          return {
            ...order,
            items: populatedItems,
          };
        }),
      );

      return populatedOrders;
    } catch (error) {
      console.error("Error getting user orders:", error);
      throw error;
    }
  }

  async getOrdersByUserId(userId: number): Promise<any[]> {
    try {
      return this.getUserOrders(userId);
    } catch (error) {
      console.error("Error getting orders by user ID:", error);
      throw error;
    }
  }

  async getAllOrders(): Promise<any[]> {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      return orders.map((order) => order.toObject());
    } catch (error) {
      console.error("Error getting all orders:", error);
      throw error;
    }
  }

  async updateOrderStatus(
    id: number,
    status: string,
  ): Promise<any | undefined> {
    try {
      // Get the existing order first to check if it already has items
      const existingOrder = await Order.findOne({ id });
      if (!existingOrder) {
        return undefined;
      }

      // Update just the status without modifying the items
      const order = await Order.findOneAndUpdate(
        { id },
        {
          status,
          updatedAt: new Date(),
        },
        { new: true },
      );

      // Return the updated order
      return order ? order.toObject() : undefined;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  // Order Item operations
  async getOrderItems(orderId: number): Promise<any[]> {
    try {
      const order = await Order.findOne({ id: orderId });
      if (!order) return [];

      // Return the items from the order
      return order.items || [];
    } catch (error) {
      console.error("Error getting order items:", error);
      throw error;
    }
  }

  async createOrderItem(orderItemData: any): Promise<any> {
    try {
      // Add the order item to the order
      const order = await Order.findOneAndUpdate(
        { id: orderItemData.orderId },
        {
          $push: { items: orderItemData },
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (!order) throw new Error("Order not found");

      // Return the newly added item
      return orderItemData;
    } catch (error) {
      console.error("Error creating order item:", error);
      throw error;
    }
  }

  async getAllOrderItems(): Promise<any[]> {
    try {
      const orders = await Order.find();
      const allItems: any[] = [];

      // Extract all items from all orders
      orders.forEach((order) => {
        if (order.items && order.items.length > 0) {
          const itemsWithOrderId = order.items.map((item: any) => ({
            ...item,
            orderId: order.id,
          }));
          allItems.push(...itemsWithOrderId);
        }
      });

      return allItems;
    } catch (error) {
      console.error("Error getting all order items:", error);
      throw error;
    }
  }

  async updateOrder(id: number, updateData: any): Promise<any | undefined> {
    try {
      const order = await Order.findOneAndUpdate(
        { id },
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { new: true },
      );
      return order ? order.toObject() : undefined;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  }

  // Subscription operations
  async createSubscription(subscriptionData: any): Promise<any> {
    try {
      const id = await getNextSequence("subscription");
      const newSubscription = new Subscription({
        ...subscriptionData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await newSubscription.save();
      return newSubscription.toObject();
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  }

  // Custom Meal Plan operations
  async getCustomMealPlans(subscriptionId: number): Promise<any[]> {
    try {
      // In MongoDB, custom meal plans would typically be part of the subscription document
      const subscription = await Subscription.findOne({ id: subscriptionId });
      if (!subscription) return [];

      // Return the customMealPlans array from the subscription, or an empty array if none
      return subscription.customMealPlans || [];
    } catch (error) {
      console.error("Error getting custom meal plans:", error);
      throw error;
    }
  }

  async createCustomMealPlan(customMealPlanData: any): Promise<any> {
    try {
      const id = await getNextSequence("customMealPlan");
      const mealPlan = {
        ...customMealPlanData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add the meal plan to the subscription document
      await Subscription.findOneAndUpdate(
        { id: customMealPlanData.subscriptionId },
        {
          $push: { customMealPlans: mealPlan },
          updatedAt: new Date(),
        },
      );

      return mealPlan;
    } catch (error) {
      console.error("Error creating custom meal plan:", error);
      throw error;
    }
  }

  async deleteCustomMealPlan(id: number): Promise<boolean> {
    try {
      // Remove the custom meal plan from the subscription document
      const result = await Subscription.updateOne(
        { "customMealPlans.id": id },
        {
          $pull: { customMealPlans: { id } },
          updatedAt: new Date(),
        },
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error deleting custom meal plan:", error);
      throw error;
    }
  }

  // User Preferences operations
  async getUserPreferences(userId: number): Promise<any | undefined> {
    try {
      // In MongoDB, user preferences can be embedded in the user document
      const user = await User.findOne({ id: userId });
      if (!user || !user.preferences) return undefined;

      return {
        id: userId,
        userId,
        ...user.preferences,
      };
    } catch (error) {
      console.error("Error getting user preferences:", error);
      throw error;
    }
  }

  async createUserPreferences(preferencesData: any): Promise<any> {
    try {
      // Add preferences to the user document
      const user = await User.findOneAndUpdate(
        { id: preferencesData.userId },
        {
          preferences: preferencesData,
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (!user) throw new Error("User not found");

      return {
        id: preferencesData.userId,
        userId: preferencesData.userId,
        ...user.preferences,
      };
    } catch (error) {
      console.error("Error creating user preferences:", error);
      throw error;
    }
  }

  async updateUserPreferences(
    userId: number,
    preferencesData: any,
  ): Promise<any | undefined> {
    try {
      // Update preferences in the user document
      const user = await User.findOneAndUpdate(
        { id: userId },
        {
          preferences: { ...preferencesData },
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (!user || !user.preferences) return undefined;

      return {
        id: userId,
        userId,
        ...user.preferences,
      };
    } catch (error) {
      console.error("Error updating user preferences:", error);
      throw error;
    }
  }

  async getSubscription(id: number): Promise<any | undefined> {
    try {
      const subscription = await Subscription.findOne({ id });
      return subscription ? subscription.toObject() : undefined;
    } catch (error) {
      console.error("Error getting subscription:", error);
      throw error;
    }
  }

  async getUserSubscriptions(userId: number): Promise<any[]> {
    try {
      const subscriptions = await Subscription.find({ userId }).sort({
        createdAt: -1,
      });
      return subscriptions.map((sub) => sub.toObject());
    } catch (error) {
      console.error("Error getting user subscriptions:", error);
      throw error;
    }
  }

  async getSubscriptionsByUserId(userId: number): Promise<any[]> {
    try {
      const subscriptions = await Subscription.find({ userId }).sort({
        createdAt: -1,
      });
      return subscriptions.map((sub) => sub.toObject());
    } catch (error) {
      console.error("Error getting subscriptions by user ID:", error);
      throw error;
    }
  }

  async getAllSubscriptions(): Promise<any[]> {
    try {
      const subscriptions = await Subscription.find().sort({ createdAt: -1 });
      return subscriptions.map((sub) => sub.toObject());
    } catch (error) {
      console.error("Error getting all subscriptions:", error);
      throw error;
    }
  }

  async updateSubscription(
    id: number,
    updateData: any,
  ): Promise<any | undefined> {
    try {
      const subscription = await Subscription.findOneAndUpdate(
        { id },
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { new: true },
      );
      return subscription ? subscription.toObject() : undefined;
    } catch (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  }

  // Address operations
  async createAddress(addressData: any): Promise<any> {
    try {
      const id = await getNextSequence("address");

      // If this address is default, unset any existing default address
      if (addressData.isDefault) {
        await Address.updateMany(
          { userId: addressData.userId },
          { isDefault: false },
        );
      }

      const newAddress = new Address({
        ...addressData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await newAddress.save();
      return newAddress.toObject();
    } catch (error) {
      console.error("Error creating address:", error);
      throw error;
    }
  }

  async getUserAddresses(userId: number): Promise<any[]> {
    try {
      const addresses = await Address.find({ userId });
      return addresses.map((addr) => addr.toObject());
    } catch (error) {
      console.error("Error getting user addresses:", error);
      throw error;
    }
  }

  // Alias methods to match IStorage interface
  async getAddresses(userId: number): Promise<any[]> {
    return this.getUserAddresses(userId);
  }

  async getAddress(id: number): Promise<any | undefined> {
    try {
      const address = await Address.findOne({ id });
      return address ? address.toObject() : undefined;
    } catch (error) {
      console.error("Error getting address:", error);
      throw error;
    }
  }

  async getAddressById(id: number): Promise<any | undefined> {
    return this.getAddress(id);
  }

  async updateAddress(id: number, updateData: any): Promise<any | undefined> {
    try {
      // If this address is being set as default, unset any existing default address
      if (updateData.isDefault) {
        const address = await Address.findOne({ id });
        if (address) {
          await Address.updateMany(
            { userId: address.userId, id: { $ne: id } },
            { isDefault: false },
          );
        }
      }

      const address = await Address.findOneAndUpdate(
        { id },
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { new: true },
      );
      return address ? address.toObject() : undefined;
    } catch (error) {
      console.error("Error updating address:", error);
      throw error;
    }
  }

  async deleteAddress(id: number): Promise<boolean> {
    try {
      const result = await Address.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting address:", error);
      throw error;
    }
  }

  // Review operations
  async getReviewsByMealId(mealId: number): Promise<any[]> {
    try {
      const reviews = await Review.find({ mealId }).sort({ createdAt: -1 });
      return reviews.map((review) => review.toObject());
    } catch (error) {
      console.error("Error getting reviews by meal ID:", error);
      throw error;
    }
  }

  async getReviewsByUserId(userId: number): Promise<any[]> {
    try {
      const reviews = await Review.find({ userId }).sort({ createdAt: -1 });
      return reviews.map((review) => review.toObject());
    } catch (error) {
      console.error("Error getting reviews by user ID:", error);
      throw error;
    }
  }

  async createReview(reviewData: any): Promise<any> {
    try {
      const id = await getNextSequence("review");
      const review = new Review({
        ...reviewData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await review.save();
      return review.toObject();
    } catch (error) {
      console.error("Error creating review:", error);
      throw error;
    }
  }

  async getAllReviews(): Promise<any[]> {
    try {
      const reviews = await Review.find().sort({ createdAt: -1 });
      return reviews.map((review) => review.toObject());
    } catch (error) {
      console.error("Error getting all reviews:", error);
      throw error;
    }
  }

  // Cart operations
  async addToCart(cartItemData: any): Promise<any> {
    try {
      // Check if already in cart
      const existingItem = await CartItem.findOne({
        userId: cartItemData.userId,
        mealId: cartItemData.mealId,
        curryOptionId: cartItemData.curryOptionId || null,
      });

      if (existingItem) {
        // Update quantity
        existingItem.quantity += cartItemData.quantity;
        existingItem.updatedAt = new Date();
        await existingItem.save();
        return existingItem.toObject();
      } else {
        // Create new cart item
        const id = await getNextSequence("cartItem");
        const cartItem = new CartItem({
          ...cartItemData,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await cartItem.save();
        return cartItem.toObject();
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  }

  async updateCartItemQuantity(
    id: number,
    quantity: number,
  ): Promise<any | undefined> {
    try {
      const cartItem = await CartItem.findOneAndUpdate(
        { id },
        {
          quantity,
          updatedAt: new Date(),
        },
        { new: true },
      );

      return cartItem ? cartItem.toObject() : undefined;
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      throw error;
    }
  }

  async removeFromCart(id: number): Promise<boolean> {
    try {
      const result = await CartItem.deleteOne({ id });
      return result.deletedCount === 1;
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  }

  // Location operations
  async getLocations(): Promise<any[]> {
    try {
      const locations = await Location.find();
      return locations.map((loc) => loc.toObject());
    } catch (error) {
      console.error("Error getting locations:", error);
      return []; // Return empty array on error instead of throwing
    }
  }

  async getLocation(id: number): Promise<any | undefined> {
    try {
      const location = await Location.findOne({ id });
      return location ? location.toObject() : undefined;
    } catch (error) {
      console.error("Error getting location:", error);
      return undefined;
    }
  }

  async getLocationByPincode(pincode: string): Promise<any | undefined> {
    try {
      const location = await Location.findOne({ pincode });
      return location ? location.toObject() : undefined;
    } catch (error) {
      console.error("Error getting location by pincode:", error);
      return undefined;
    }
  }

  async createLocation(locationData: any): Promise<any> {
    try {
      // Use the provided ID if available, otherwise get next sequence
      const id = locationData.id || (await getNextSequence("location"));
      const newLocation = new Location({
        ...locationData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await newLocation.save();
      return newLocation.toObject();
    } catch (error) {
      console.error("Error creating location:", error);
      throw error;
    }
  }

  async updateLocation(
    id: number,
    locationData: any,
  ): Promise<any | undefined> {
    try {
      const updatedLocation = await Location.findOneAndUpdate(
        { id },
        {
          ...locationData,
          updatedAt: new Date(),
        },
        { new: true },
      );
      return updatedLocation ? updatedLocation.toObject() : undefined;
    } catch (error) {
      console.error("Error updating location:", error);
      return undefined;
    }
  }

  async deleteLocation(id: number): Promise<boolean> {
    try {
      const result = await Location.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting location:", error);
      return false;
    }
  }

  async createCurryOption(curryOptionData: any): Promise<any> {
    try {
      console.log(
        "Creating curry option with data:",
        JSON.stringify(curryOptionData),
      );

      // Ensure mealIds is properly formatted as an array
      let mealIds = curryOptionData.mealIds || [];
      if (!Array.isArray(mealIds)) {
        mealIds = [];
      }

      // Create with properly formatted data
      const newCurryOption = new CurryOption({
        ...curryOptionData,
        mealIds: mealIds,
      });

      await newCurryOption.save();
      const result = newCurryOption.toObject();
      console.log("Created curry option result:", result);
      return result;
    } catch (error) {
      console.error("Error creating curry option:", error);
      throw error;
    }
  }

  async updateCurryOption(
    id: string,
    updateData: any,
  ): Promise<any | undefined> {
    try {
      console.log("Updating curry option with ID:", id);
      console.log("Update data received:", JSON.stringify(updateData));

      // Ensure mealIds is properly formatted as an array
      let mealIds = updateData.mealIds || [];
      if (!Array.isArray(mealIds)) {
        mealIds = [];
      }

      // Apply the update with ensured array format
      const updatedCurryOption = await CurryOption.findOneAndUpdate(
        { id },
        {
          ...updateData,
          mealIds: mealIds,
          updatedAt: new Date(),
        },
        { new: true },
      ).lean();

      console.log("Updated curry option result:", updatedCurryOption);
      return updatedCurryOption || undefined;
    } catch (error) {
      console.error("Error updating curry option:", error);
      return undefined;
    }
  }

  async deleteCurryOption(id: string): Promise<boolean> {
    try {
      const result = await CurryOption.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting curry option:", error);
      return false;
    }
  }
}

// Export a singleton instance
export const mongoStorage = new MongoDBStorage();
