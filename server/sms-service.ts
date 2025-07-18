// smsService.ts - Now using Fast2SMS instead of Twilio
import { smsService } from './sms-service-fast2sms';

interface SMSMessage {
  to: string;
  message: string;
}

class SMSService {
  private isConfigured: boolean = false;

  constructor() {
    // Check if Fast2SMS is configured
    this.isConfigured = !!(process.env.FAST2SMS_API_KEY);

    if (!this.isConfigured) {
      console.log(
        "SMS service not configured - SMS notifications will be logged only",
      );
    } else {
      console.log("SMS service configured with Fast2SMS and ready");
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      if (!this.isConfigured) {
        console.log(`SMS would be sent to ${to}: ${message}`);
        return true;
      }

      return await smsService.sendSMS({ to, message });
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  async sendSubscriptionDeliveryNotification(
    userPhone: string,
    userName: string,
    mainMeal: string,
    sides: string[],
    deliveryTime: string,
  ): Promise<boolean> {
    const sidesText = sides.length > 0 ? ` with ${sides.join(", ")}` : "";
    const message = `Hi ${userName}! Your meal for today: ${mainMeal}${sidesText}. Delivery at ${deliveryTime}. - Millet Meals`;

    return this.sendSMS(userPhone, message);
  }

  async sendOrderDeliveryNotification(
    userPhone: string,
    userName: string,
    orderId: number,
    items: any[],
    deliveryTime: string,
  ): Promise<boolean> {
    const itemsText = items
      .map((item) => `${item.quantity}x ${item.meal?.name || "Item"}`)
      .join(", ");
    const message = `Hi ${userName}! Your order #${orderId} is ready: ${itemsText}. Delivery at ${deliveryTime}. - Millet Meals`;

    return this.sendSMS(userPhone, message);
  }

  async sendOrderStatusNotification(
    userPhone: string,
    userName: string,
    orderId: number,
    status: string,
    estimatedTime?: string,
  ): Promise<boolean> {
    const statusMessages: Record<string, string> = {
      preparing: "is being prepared",
      in_transit: "is on the way",
      out_for_delivery: "is out for delivery",
      nearby: "is nearby and will arrive soon",
      delivered: "has been delivered",
    };

    const statusText = statusMessages[status] || `status updated to ${status}`;
    const timeText = estimatedTime ? ` ETA: ${estimatedTime}` : "";
    const message = `Hi ${userName}! Your order #${orderId} ${statusText}.${timeText} - Millet Meals`;

    return this.sendSMS(userPhone, message);
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  getStatus(): string {
    return this.isConfigured
      ? "SMS service ready with Fast2SMS"
      : "SMS service in logging mode - need Fast2SMS API key";
  }
}

// Exporting the service instance (renamed to avoid conflict)
export const smsServiceLegacy = new SMSService();

// Helper function for general-purpose SMS sending
export async function sendRealSmsNotification(
  userPhone: string,
  userName: string,
  title: string,
  message: string,
): Promise<boolean> {
  try {
    const fullMessage = `${title}: ${message}`;
    return await smsServiceLegacy.sendSMS(userPhone, fullMessage);
  } catch (error) {
    console.error("Error sending real SMS notification:", error);
    return false;
  }
}
