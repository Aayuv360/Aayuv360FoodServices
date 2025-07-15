import NodeCache from "node-cache";

// Meal cache with 15-minute TTL for better performance
const menuCache = new NodeCache({ stdTTL: 900 }); // 5 minutes for menu items
const userCache = new NodeCache({ stdTTL: 600 }); // 10 minutes for user data
const analyticsCache = new NodeCache({ stdTTL: 900 }); // 15 minutes for analytics
const subscriptionCache = new NodeCache({ stdTTL: 600 }); // 10 minutes for subscriptions

export class CacheService {
  // Menu caching
  static setMeals(meals: any[]) {
    menuCache.set("all_meals", meals);
  }

  static getMeals() {
    return menuCache.get("all_meals");
  }

  static setMealById(id: number, meal: any) {
    menuCache.set(`meal_${id}`, meal);
  }

  static getMealById(id: number) {
    return menuCache.get(`meal_${id}`);
  }

  // User caching
  static setUser(userId: number, user: any) {
    userCache.set(`user_${userId}`, user);
  }

  static getUser(userId: number) {
    return userCache.get(`user_${userId}`);
  }

  static deleteUser(userId: number) {
    userCache.del(`user_${userId}`);
  }

  // Subscription caching
  static setSubscriptionPlans(plans: any[]) {
    subscriptionCache.set("subscription_plans", plans);
  }

  static getSubscriptionPlans() {
    return subscriptionCache.get("subscription_plans");
  }

  static setUserSubscriptions(userId: number, subscriptions: any[]) {
    subscriptionCache.set(`user_subscriptions_${userId}`, subscriptions);
  }

  static getUserSubscriptions(userId: number) {
    return subscriptionCache.get(`user_subscriptions_${userId}`);
  }

  // Analytics caching
  static setAnalytics(range: string, data: any) {
    analyticsCache.set(`analytics_${range}`, data);
  }

  static getAnalytics(range: string) {
    return analyticsCache.get(`analytics_${range}`);
  }

  // Generic cache operations
  static clearAll() {
    menuCache.flushAll();
    userCache.flushAll();
    analyticsCache.flushAll();
    subscriptionCache.flushAll();
  }

  static clearMenuCache() {
    menuCache.flushAll();
  }

  static clearUserCache(userId?: number) {
    if (userId) {
      userCache.del(`user_${userId}`);
      subscriptionCache.del(`user_subscriptions_${userId}`);
    } else {
      userCache.flushAll();
      subscriptionCache.flushAll();
    }
  }

  // Cache statistics
  static getStats() {
    return {
      menu: menuCache.getStats(),
      user: userCache.getStats(),
      analytics: analyticsCache.getStats(),
      subscription: subscriptionCache.getStats(),
    };
  }
}

export default CacheService;