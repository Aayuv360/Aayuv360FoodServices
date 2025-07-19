import nodemailer from "nodemailer";
import logger from "./logger";

interface EmailConfig {
  service?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class NodemailerService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      const emailService = process.env.EMAIL_SERVICE || "gmail";
      const emailHost = process.env.EMAIL_HOST;
      const emailPort = process.env.EMAIL_PORT
        ? parseInt(process.env.EMAIL_PORT)
        : undefined;
      const emailSecure = process.env.EMAIL_SECURE === "true";

      if (!emailUser || !emailPass) {
        logger.warn(
          "Email credentials not configured - email notifications disabled",
        );
        return;
      }

      const config: EmailConfig = {
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      };

      if (emailHost) {
        config.host = emailHost;
        config.port = emailPort || 587;
        config.secure = emailSecure;
      } else {
        config.service = emailService;
      }

      this.transporter = nodemailer.createTransport(config);
      this.isConfigured = true;

      logger.info("✅ Nodemailer email service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Nodemailer service:", error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      logger.warn("Email service not configured - skipping email send");
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}`, {
        messageId: result.messageId,
      });
      return true;
    } catch (error) {
      logger.error("Failed to send email:", error);
      return false;
    }
  }

  // Order confirmation email
  async sendOrderConfirmation(
    to: string,
    orderNumber: string,
    totalAmount: number,
  ): Promise<boolean> {
    const subject = `Order Confirmation - ${orderNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Order Confirmation</h2>
        <p>Dear Customer,</p>
        <p>Thank you for your order! Your order has been confirmed and is being processed.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Order Details</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
        </div>
        <p>We'll notify you when your order is out for delivery.</p>
        <p>Best regards,<br>Millet Food Service Team</p>
      </div>
    `;
    const text = `Order Confirmation - ${orderNumber}\n\nThank you for your order! Order Number: ${orderNumber}, Total: ₹${totalAmount}`;

    return this.sendEmail({ to, subject, html, text });
  }

  // Password reset email
  async sendPasswordReset(
    to: string,
    resetToken: string,
    resetUrl: string,
  ): Promise<boolean> {
    const subject = "Password Reset Request - Millet Food Service";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Dear Customer,</p>
        <p>You requested a password reset for your Millet Food Service account.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
        <p>Best regards,<br>Millet Food Service Team</p>
      </div>
    `;
    const text = `Password Reset Request\n\nClick this link to reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`;

    return this.sendEmail({ to, subject, html, text });
  }

  // Subscription confirmation email
  async sendSubscriptionConfirmation(
    to: string,
    planName: string,
    startDate: string,
  ): Promise<boolean> {
    const subject = `Subscription Confirmed - ${planName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Subscription Confirmed</h2>
        <p>Dear Customer,</p>
        <p>Your subscription has been successfully activated!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Subscription Details</h3>
          <p><strong>Plan:</strong> ${planName}</p>
          <p><strong>Start Date:</strong> ${startDate}</p>
        </div>
        <p>You'll receive your first delivery as per your selected schedule.</p>
        <p>Best regards,<br>Millet Food Service Team</p>
      </div>
    `;
    const text = `Subscription Confirmed - ${planName}\n\nPlan: ${planName}\nStart Date: ${startDate}`;

    return this.sendEmail({ to, subject, html, text });
  }
}

// Export singleton instance
export const emailService = new NodemailerService();
