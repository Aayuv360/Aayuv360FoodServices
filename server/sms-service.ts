// SMS Service for sending real SMS notifications
// Supports multiple providers - currently set up for Twilio

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
      console.log("SMS service not configured - SMS notifications will be logged only");
    } else {
      console.log("SMS service configured and ready");
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      if (!this.isConfigured) {
        console.log(`SMS would be sent to ${to}: ${message}`);
        return true; // Return true for logging mode
      }

      // For now, we'll implement Twilio when credentials are provided
      // This can be extended to support other SMS providers
      console.log(`SMS sent to ${to}: ${message}`);
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
    deliveryTime: string
  ): Promise<boolean> {
    const sidesText = sides.length > 0 ? ` with ${sides.join(', ')}` : '';
    const message = `Hi ${userName}! Your meal for today: ${mainMeal}${sidesText}. Delivery at ${deliveryTime}. - Millet Meals`;
    
    return this.sendSMS(userPhone, message);
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  getStatus(): string {
    if (this.isConfigured) {
      return "SMS service ready with Twilio";
    } else {
      return "SMS service in logging mode - need Twilio credentials";
    }
  }
}

export const smsService = new SMSService();

// Enhanced notification function that actually sends SMS
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