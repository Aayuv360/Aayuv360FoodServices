import { mongoStorage } from "./mongoStorage";

export interface DeliveryScheduleItem {
  id: number;
  userId: number;
  subscriptionId: number;
  scheduledDate: Date;
  mealPlan: {
    main: string;
    sides: string[];
  };
  deliveryStatus: 'scheduled' | 'preparing' | 'out_for_delivery' | 'delivered';
  notificationSent: boolean;
  createdAt: Date;
}

export class DeliveryScheduler {
  /**
   * Get delivery items scheduled for today across all active subscriptions
   */
  async getTodayDeliveries(): Promise<DeliveryScheduleItem[]> {
    try {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayStart.getDate() + 1);

      // Get all active subscriptions
      const allSubscriptions = await mongoStorage.getAllSubscriptions();
      const activeSubscriptions = allSubscriptions.filter((sub: any) => {
        const startDate = new Date(sub.startDate);
        const endDate = sub.endDate ? new Date(sub.endDate) : new Date(startDate.getTime() + (sub.plan?.duration || 30) * 24 * 60 * 60 * 1000);
        
        return sub.status === 'active' && 
               startDate <= today && 
               endDate > today;
      });

      const deliveryItems: DeliveryScheduleItem[] = [];

      for (const subscription of activeSubscriptions) {
        const deliveryItem = await this.generateDeliveryItemForSubscription(subscription, today);
        if (deliveryItem) {
          deliveryItems.push(deliveryItem);
        }
      }

      return deliveryItems;
    } catch (error) {
      console.error('Error getting today deliveries:', error);
      return [];
    }
  }

  /**
   * Get delivery items scheduled for a specific user
   */
  async getUserDeliveries(userId: number, date?: Date): Promise<DeliveryScheduleItem[]> {
    try {
      const targetDate = date || new Date();
      const userSubscriptions = await mongoStorage.getSubscriptionsByUserId(userId);
      
      const activeSubscriptions = userSubscriptions.filter((sub: any) => {
        const startDate = new Date(sub.startDate);
        const endDate = sub.endDate ? new Date(sub.endDate) : new Date(startDate.getTime() + (sub.plan?.duration || 30) * 24 * 60 * 60 * 1000);
        
        return sub.status === 'active' && 
               startDate <= targetDate && 
               endDate > targetDate;
      });

      const deliveryItems: DeliveryScheduleItem[] = [];

      for (const subscription of activeSubscriptions) {
        const deliveryItem = await this.generateDeliveryItemForSubscription(subscription, targetDate);
        if (deliveryItem) {
          deliveryItems.push(deliveryItem);
        }
      }

      return deliveryItems;
    } catch (error) {
      console.error('Error getting user deliveries:', error);
      return [];
    }
  }

  /**
   * Generate delivery item for a specific subscription and date
   */
  private async generateDeliveryItemForSubscription(subscription: any, date: Date): Promise<DeliveryScheduleItem | null> {
    try {
      if (!subscription.plan?.weeklyMeals) {
        return null;
      }

      // Get day of week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];

      const mealPlan = subscription.plan.weeklyMeals[dayName];
      if (!mealPlan) {
        return null;
      }

      return {
        id: Date.now() + Math.random(), // Temporary ID generation
        userId: subscription.userId,
        subscriptionId: subscription.id,
        scheduledDate: date,
        mealPlan: {
          main: mealPlan.main,
          sides: mealPlan.sides || []
        },
        deliveryStatus: 'scheduled',
        notificationSent: false,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error generating delivery item:', error);
      return null;
    }
  }

  /**
   * Get delivery schedule for the next 7 days
   */
  async getWeeklyDeliverySchedule(): Promise<{ [date: string]: DeliveryScheduleItem[] }> {
    try {
      const schedule: { [date: string]: DeliveryScheduleItem[] } = {};
      
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        const dateKey = date.toISOString().split('T')[0];
        const deliveries = await this.getTodayDeliveries();
        
        // Filter deliveries for this specific date
        schedule[dateKey] = deliveries.filter(delivery => {
          const deliveryDate = delivery.scheduledDate.toISOString().split('T')[0];
          return deliveryDate === dateKey;
        });
      }

      return schedule;
    } catch (error) {
      console.error('Error getting weekly delivery schedule:', error);
      return {};
    }
  }
}

export const deliveryScheduler = new DeliveryScheduler();