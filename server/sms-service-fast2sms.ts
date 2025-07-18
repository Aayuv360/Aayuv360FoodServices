import axios from 'axios';
import logger from './logger';

interface Fast2SMSConfig {
  apiKey: string;
  senderId?: string;
  route: string;
}

interface SMSOptions {
  to: string;
  message: string;
}

class Fast2SMSService {
  private config: Fast2SMSConfig | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const apiKey = process.env.FAST2SMS_API_KEY;
      
      if (!apiKey) {
        logger.warn('Fast2SMS API key not configured - SMS notifications disabled');
        return;
      }

      this.config = {
        apiKey,
        senderId: process.env.FAST2SMS_SENDER_ID || 'MILLETS',
        route: process.env.FAST2SMS_ROUTE || 'q', // 'q' for promotional, 't' for transactional
      };

      this.isConfigured = true;
      logger.info('✅ Fast2SMS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Fast2SMS service:', error);
    }
  }

  async sendSMS(options: SMSOptions): Promise<boolean> {
    if (!this.isConfigured || !this.config) {
      logger.warn('Fast2SMS service not configured - skipping SMS send');
      return false;
    }

    try {
      // Clean phone number (remove +91 if present, keep only 10 digits)
      const cleanPhone = options.to.replace(/^\+91/, '').replace(/\D/g, '');
      
      if (cleanPhone.length !== 10) {
        logger.error('Invalid phone number format for Fast2SMS:', options.to);
        return false;
      }

      const requestData = {
        authorization: this.config.apiKey,
        sender_id: this.config.senderId,
        message: options.message,
        language: 'english',
        route: this.config.route,
        numbers: cleanPhone,
      };

      const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data.return) {
        logger.info(`SMS sent successfully to ${cleanPhone}`, { 
          messageId: response.data.request_id,
          status: response.data.message
        });
        return true;
      } else {
        logger.error('Fast2SMS API returned error:', response.data);
        return false;
      }
    } catch (error) {
      logger.error('Failed to send SMS via Fast2SMS:', error);
      return false;
    }
  }

  // Order notification SMS
  async sendOrderNotification(phone: string, orderNumber: string, status: string): Promise<boolean> {
    const message = `Your order ${orderNumber} is now ${status}. Track your order in the Millet Food Service app. Thank you!`;
    return this.sendSMS({ to: phone, message });
  }

  // Delivery notification SMS
  async sendDeliveryNotification(phone: string, orderNumber: string): Promise<boolean> {
    const message = `Your order ${orderNumber} is out for delivery! Our delivery partner will reach you soon. - Millet Food Service`;
    return this.sendSMS({ to: phone, message });
  }

  // OTP SMS (for future use)
  async sendOTP(phone: string, otp: string): Promise<boolean> {
    const message = `Your OTP for Millet Food Service is: ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;
    return this.sendSMS({ to: phone, message });
  }

  // Password reset notification SMS
  async sendPasswordResetNotification(phone: string): Promise<boolean> {
    const message = `Password reset link sent to your registered email. Please check your email and follow the instructions. - Millet Food Service`;
    return this.sendSMS({ to: phone, message });
  }
}

// Export singleton instance
export const smsService = new Fast2SMSService();