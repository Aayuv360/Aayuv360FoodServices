// smsService.ts

interface SMSConfig {
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
}

interface SMSMessage {
  to: string;
  message: string;
}

class SMSService {
  private config: SMSConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    };

    this.isConfigured = !!(
      this.config.accountSid &&
      this.config.authToken &&
      this.config.phoneNumber
    );

    if (!this.isConfigured) {
      console.log(
        "SMS service not configured - SMS notifications will be logged only",
      );
    } else {
      console.log("SMS service configured and ready");
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      if (!this.isConfigured) {
        console.log(`SMS would be sent to ${to}: ${message}`);
        return true;
      }

      const twilio = await import("twilio");
      const client = twilio.default(
        this.config.accountSid!,
        this.config.authToken!,
      );
      console.log("Using from number:", this.config.phoneNumber);

      const result = await client.messages.create({
        body: message,
        from: this.config.phoneNumber,
        to: to,
      });

      console.log(`SMS sent successfully to ${to}. SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error("Error sending SMS:", error);
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
      ? "SMS service ready with Twilio"
      : "SMS service in logging mode - need Twilio credentials";
  }
}

// Exporting the service instance
export const smsService = new SMSService();

// Helper function for general-purpose SMS sending
export async function sendRealSmsNotification(
  userPhone: string,
  userName: string,
  title: string,
  message: string,
): Promise<boolean> {
  try {
    const fullMessage = `${title}: ${message}`;
    return await smsService.sendSMS(userPhone, fullMessage);
  } catch (error) {
    console.error("Error sending real SMS notification:", error);
    return false;
  }
}
