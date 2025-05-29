import { DeliveryScheduleItem } from "./delivery-scheduler";
import { mongoStorage } from "./mongoStorage";

export interface SMSNotification {
  id: number;
  userId: number;
  phoneNumber: string;
  message: string;
  deliveryItemId: number;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  createdAt: Date;
}

export class SMSService {
  private twilioAccountSid: string | undefined;
  private twilioAuthToken: string | undefined;
  private twilioPhoneNumber: string | undefined;

  constructor() {
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  /**
   * Check if SMS service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.twilioAccountSid && this.twilioAuthToken && this.twilioPhoneNumber);
  }

  /**
   * Send delivery notification SMS to user
   */
  async sendDeliveryNotification(deliveryItem: DeliveryScheduleItem, userPhone: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.error('SMS service not configured. Missing Twilio credentials.');
        return false;
      }

      if (!userPhone) {
        console.error('User phone number not provided');
        return false;
      }

      const message = this.generateDeliveryMessage(deliveryItem);
      
      // Here you would integrate with Twilio or your SMS provider
      // For now, we'll simulate the SMS sending
      console.log(`SMS would be sent to ${userPhone}: ${message}`);
      
      // In a real implementation, you would use Twilio SDK:
      // const twilio = require('twilio')(this.twilioAccountSid, this.twilioAuthToken);
      // await twilio.messages.create({
      //   body: message,
      //   from: this.twilioPhoneNumber,
      //   to: userPhone
      // });

      return true;
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return false;
    }
  }

  /**
   * Generate delivery notification message
   */
  private generateDeliveryMessage(deliveryItem: DeliveryScheduleItem): string {
    const date = deliveryItem.scheduledDate.toLocaleDateString();
    const mainDish = deliveryItem.mealPlan.main;
    const sides = deliveryItem.mealPlan.sides.join(', ');
    
    return `🍽️ Your Aayuv Millet meal is scheduled for delivery today (${date})!\n\n` +
           `Main: ${mainDish}\n` +
           `Sides: ${sides}\n\n` +
           `We'll notify you when your order is being prepared. Enjoy your healthy millet meal!`;
  }

  /**
   * Send bulk notifications for today's deliveries
   */
  async sendTodayDeliveryNotifications(deliveryItems: DeliveryScheduleItem[]): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const item of deliveryItems) {
      try {
        // Get user phone number from database
        const user = await this.getUserById(item.userId);
        if (user && user.phone) {
          const success = await this.sendDeliveryNotification(item, user.phone);
          if (success) {
            sent++;
          } else {
            failed++;
          }
        } else {
          console.log(`No phone number found for user ${item.userId}`);
          failed++;
        }
      } catch (error) {
        console.error(`Error sending notification for delivery item ${item.id}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Get user by ID from MongoDB storage
   */
  private async getUserById(userId: number): Promise<any> {
    try {
      return await mongoStorage.getUser(userId);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Send status update notification (preparing, out for delivery, etc.)
   */
  async sendStatusUpdateNotification(userId: number, status: string, estimatedTime?: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.error('SMS service not configured');
        return false;
      }

      const user = await this.getUserById(userId);
      if (!user || !user.phone) {
        console.error('User or phone number not found');
        return false;
      }

      let message = '';
      switch (status) {
        case 'preparing':
          message = '👨‍🍳 Great news! Your Aayuv Millet meal is now being prepared in our kitchen!';
          break;
        case 'out_for_delivery':
          message = `🚗 Your meal is on its way! ${estimatedTime ? `Estimated delivery: ${estimatedTime}` : 'Track your delivery in the app.'}`;
          break;
        case 'nearby':
          message = '📍 Your delivery partner is nearby! Please be ready to receive your fresh millet meal.';
          break;
        case 'delivered':
          message = '✅ Your Aayuv Millet meal has been delivered! Enjoy your healthy and delicious meal!';
          break;
        default:
          message = `📱 Update: Your meal status has been updated to ${status}`;
      }

      console.log(`Status SMS would be sent to ${user.phone}: ${message}`);
      return true;
    } catch (error) {
      console.error('Error sending status update notification:', error);
      return false;
    }
  }
}

export const smsService = new SMSService();