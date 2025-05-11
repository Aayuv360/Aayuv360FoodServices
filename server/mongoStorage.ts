import { 
  User, Meal, CartItem, Order, Subscription, Address, Location,
  UserDocument, MealDocument, CartItemDocument, OrderDocument, 
  SubscriptionDocument, AddressDocument, LocationDocument,
  getNextSequence
} from '../shared/mongoModels';
import session from 'express-session';
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// MongoDB Storage class implementation
export class MongoDBStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User operations
  async getUser(id: number): Promise<any | undefined> {
    try {
      const user = await User.findOne({ id });
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    try {
      const user = await User.findOne({ username });
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async createUser(userData: any): Promise<any> {
    try {
      const id = await getNextSequence('user');
      const newUser = new User({
        ...userData,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newUser.save();
      return newUser.toObject();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<any> {
    try {
      const user = await User.findOneAndUpdate(
        { id: userId },
        { 
          stripeCustomerId: customerId,
          updatedAt: new Date()
        },
        { new: true }
      );
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error('Error updating stripe customer ID:', error);
      throw error;
    }
  }
  
  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<any> {
    try {
      const user = await User.findOneAndUpdate(
        { id: userId },
        { 
          stripeCustomerId: stripeInfo.stripeCustomerId, 
          stripeSubscriptionId: stripeInfo.stripeSubscriptionId,
          updatedAt: new Date()
        },
        { new: true }
      );
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error('Error updating user stripe info:', error);
      throw error;
    }
  }

  // Meal operations
  async getMeals(): Promise<any[]> {
    try {
      const meals = await Meal.find().sort({ category: 1 });
      return meals.map(meal => meal.toObject());
    } catch (error) {
      console.error('Error getting meals:', error);
      throw error;
    }
  }

  async getMeal(id: number): Promise<any | undefined> {
    try {
      const meal = await Meal.findOne({ id });
      return meal ? meal.toObject() : undefined;
    } catch (error) {
      console.error('Error getting meal:', error);
      throw error;
    }
  }

  async createMeal(mealData: any): Promise<any> {
    try {
      const id = await getNextSequence('meal');
      const newMeal = new Meal({
        ...mealData,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newMeal.save();
      return newMeal.toObject();
    } catch (error) {
      console.error('Error creating meal:', error);
      throw error;
    }
  }

  // Cart operations
  async getCartItems(userId: number): Promise<any[]> {
    try {
      const cartItems = await CartItem.find({ userId });
      const items = cartItems.map(item => item.toObject());
      
      // Populate meals data
      const populatedItems = await Promise.all(items.map(async (item) => {
        const meal = await this.getMeal(item.mealId);
        return {
          ...item,
          meal
        };
      }));
      
      return populatedItems;
    } catch (error) {
      console.error('Error getting cart items:', error);
      throw error;
    }
  }

  async getCartItem(id: number): Promise<any | undefined> {
    try {
      const cartItem = await CartItem.findOne({ id });
      return cartItem ? cartItem.toObject() : undefined;
    } catch (error) {
      console.error('Error getting cart item:', error);
      throw error;
    }
  }

  async createCartItem(cartItemData: any): Promise<any> {
    try {
      const id = await getNextSequence('cartItem');
      const newCartItem = new CartItem({
        ...cartItemData,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newCartItem.save();
      
      // Return with populated meal
      const createdItem = newCartItem.toObject();
      const meal = await this.getMeal(createdItem.mealId);
      return {
        ...createdItem,
        meal
      };
    } catch (error) {
      console.error('Error creating cart item:', error);
      throw error;
    }
  }

  async updateCartItem(id: number, updateData: any): Promise<any | undefined> {
    try {
      const cartItem = await CartItem.findOneAndUpdate(
        { id },
        { 
          ...updateData,
          updatedAt: new Date()
        },
        { new: true }
      );
      
      if (!cartItem) return undefined;
      
      // Return with populated meal
      const updatedItem = cartItem.toObject();
      const meal = await this.getMeal(updatedItem.mealId);
      return {
        ...updatedItem,
        meal
      };
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  async deleteCartItem(id: number): Promise<boolean> {
    try {
      const result = await CartItem.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting cart item:', error);
      throw error;
    }
  }

  async clearCart(userId: number): Promise<boolean> {
    try {
      const result = await CartItem.deleteMany({ userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  // Order operations
  async createOrder(orderData: any): Promise<any> {
    try {
      const id = await getNextSequence('order');
      const newOrder = new Order({
        ...orderData,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newOrder.save();
      return newOrder.toObject();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getOrder(id: number): Promise<any | undefined> {
    try {
      const order = await Order.findOne({ id });
      if (!order) return undefined;
      
      // Populate items with meals
      const orderObj = order.toObject();
      const populatedItems = await Promise.all(orderObj.items.map(async (item: any) => {
        const meal = await this.getMeal(item.mealId);
        return {
          ...item,
          meal
        };
      }));
      
      return {
        ...orderObj,
        items: populatedItems
      };
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  }

  async getUserOrders(userId: number): Promise<any[]> {
    try {
      const orders = await Order.find({ userId }).sort({ createdAt: -1 });
      const ordersList = orders.map(order => order.toObject());
      
      // Populate items with meals
      const populatedOrders = await Promise.all(ordersList.map(async (order) => {
        const populatedItems = await Promise.all(order.items.map(async (item: any) => {
          const meal = await this.getMeal(item.mealId);
          return {
            ...item,
            meal
          };
        }));
        
        return {
          ...order,
          items: populatedItems
        };
      }));
      
      return populatedOrders;
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  }

  async updateOrder(id: number, updateData: any): Promise<any | undefined> {
    try {
      const order = await Order.findOneAndUpdate(
        { id },
        { 
          ...updateData,
          updatedAt: new Date()
        },
        { new: true }
      );
      return order ? order.toObject() : undefined;
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  // Subscription operations
  async createSubscription(subscriptionData: any): Promise<any> {
    try {
      const id = await getNextSequence('subscription');
      const newSubscription = new Subscription({
        ...subscriptionData,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newSubscription.save();
      return newSubscription.toObject();
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async getSubscription(id: number): Promise<any | undefined> {
    try {
      const subscription = await Subscription.findOne({ id });
      return subscription ? subscription.toObject() : undefined;
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  }

  async getUserSubscriptions(userId: number): Promise<any[]> {
    try {
      const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 });
      return subscriptions.map(sub => sub.toObject());
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      throw error;
    }
  }

  async updateSubscription(id: number, updateData: any): Promise<any | undefined> {
    try {
      const subscription = await Subscription.findOneAndUpdate(
        { id },
        { 
          ...updateData,
          updatedAt: new Date()
        },
        { new: true }
      );
      return subscription ? subscription.toObject() : undefined;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Address operations
  async createAddress(addressData: any): Promise<any> {
    try {
      const id = await getNextSequence('address');
      
      // If this address is default, unset any existing default address
      if (addressData.isDefault) {
        await Address.updateMany(
          { userId: addressData.userId },
          { isDefault: false }
        );
      }
      
      const newAddress = new Address({
        ...addressData,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newAddress.save();
      return newAddress.toObject();
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  }

  async getUserAddresses(userId: number): Promise<any[]> {
    try {
      const addresses = await Address.find({ userId });
      return addresses.map(addr => addr.toObject());
    } catch (error) {
      console.error('Error getting user addresses:', error);
      throw error;
    }
  }
  
  async getAddress(id: number): Promise<any | undefined> {
    try {
      const address = await Address.findOne({ id });
      return address ? address.toObject() : undefined;
    } catch (error) {
      console.error('Error getting address:', error);
      throw error;
    }
  }

  async updateAddress(id: number, updateData: any): Promise<any | undefined> {
    try {
      // If this address is being set as default, unset any existing default address
      if (updateData.isDefault) {
        const address = await Address.findOne({ id });
        if (address) {
          await Address.updateMany(
            { userId: address.userId, id: { $ne: id } },
            { isDefault: false }
          );
        }
      }
      
      const address = await Address.findOneAndUpdate(
        { id },
        { 
          ...updateData,
          updatedAt: new Date()
        },
        { new: true }
      );
      return address ? address.toObject() : undefined;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  }

  async deleteAddress(id: number): Promise<boolean> {
    try {
      const result = await Address.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }

  // Location operations
  async getLocations(): Promise<any[]> {
    try {
      const locations = await Location.find();
      return locations.map(loc => loc.toObject());
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  }

  async createLocation(locationData: any): Promise<any> {
    try {
      const id = await getNextSequence('location');
      const newLocation = new Location({
        ...locationData,
        id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newLocation.save();
      return newLocation.toObject();
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const mongoStorage = new MongoDBStorage();