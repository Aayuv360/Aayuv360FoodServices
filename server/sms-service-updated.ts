import { smsService } from './sms-service-fast2sms';

interface SMSMessage {
  to: string;
  message: string;
}

class SMSServiceWrapper {
  // Order notification SMS
  async sendOrderNotification(phone: string, orderNumber: string, status: string): Promise<boolean> {
    return smsService.sendOrderNotification(phone, orderNumber, status);
  }

  // Delivery notification SMS
  async sendDeliveryNotification(phone: string, orderNumber: string): Promise<boolean> {
    return smsService.sendDeliveryNotification(phone, orderNumber);
  }

  // Generic SMS method
  async sendSMS(to: string, message: string): Promise<boolean> {
    return smsService.sendSMS({ to, message });
  }

  // Subscription notification
  async sendSubscriptionNotification(phone: string, planName: string, startDate: string): Promise<boolean> {
    const message = `Your ${planName} subscription is now active! Starting ${startDate}. Enjoy healthy millet meals delivered to your door. - Millet Food Service`;
    return this.sendSMS(phone, message);
  }

  // Test SMS
  async sendTestSMS(phone: string): Promise<boolean> {
    const message = "Test SMS from Millet Food Service via Fast2SMS. SMS service is working correctly!";
    return this.sendSMS(phone, message);
  }
}

// Export singleton instance matching existing interface
export const smsServiceWrapper = new SMSServiceWrapper();
export default smsServiceWrapper;