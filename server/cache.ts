import NodeCache from "node-cache";

const menuCache = new NodeCache({ stdTTL: 900 });
const userCache = new NodeCache({ stdTTL: 600 });
const analyticsCache = new NodeCache({ stdTTL: 900 });
const subscriptionCache = new NodeCache({ stdTTL: 600 });
export class CacheService {
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

  static setUser(userId: number, user: any) {
    userCache.set(`user_${userId}`, user);
  }

  static getUser(userId: number) {
    return userCache.get(`user_${userId}`);
  }

  static deleteUser(userId: number) {
    userCache.del(`user_${userId}`);
  }

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

  static setAnalytics(range: string, data: any) {
    analyticsCache.set(`analytics_${range}`, data);
  }

  static getAnalytics(range: string) {
    return analyticsCache.get(`analytics_${range}`);
  }

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
