import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("SENDGRID_API_KEY not found - email notifications disabled");
}

interface EmailNotificationData {
  userEmail: string;
  userName: string;
  mainMeal: string;
  sides: string[];
  deliveryTime: string;
}

/**
 * Send subscription delivery notification email
 */
export async function sendSubscriptionDeliveryEmail(data: EmailNotificationData): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.log("SendGrid not configured, skipping email notification");
      return false;
    }

    const sidesText = data.sides.length > 0 ? ` with ${data.sides.join(', ')}` : '';
    
    const emailContent = {
      to: data.userEmail,
      from: 'noreply@milletmeals.com', // Replace with your verified sender email
      subject: "Today's Meal Delivery - Millet Meals",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c5530;">Hello ${data.userName},</h2>
          
          <p style="font-size: 16px; line-height: 1.5;">
            Your delicious meal for today is ready for delivery!
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c5530; margin-top: 0;">Today's Meal:</h3>
            <p style="font-size: 18px; font-weight: bold; color: #333;">
              🍽️ ${data.mainMeal}${sidesText}
            </p>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">
              <strong>Delivery Time:</strong> ${data.deliveryTime}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Thank you for choosing Millet Meals for your healthy dining experience!
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated notification. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `Hello ${data.userName},\n\nYour meal for today: ${data.mainMeal}${sidesText}\nDelivery Time: ${data.deliveryTime}\n\nThank you for choosing Millet Meals!`
    };

    await sgMail.send(emailContent);
    console.log(`Email notification sent to ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

/**
 * Send test email notification
 */
export async function sendTestEmail(userEmail: string, userName: string): Promise<boolean> {
  return sendSubscriptionDeliveryEmail({
    userEmail,
    userName,
    mainMeal: "Millet Khichdi (Test)",
    sides: ["Dal", "Mixed Vegetables"],
    deliveryTime: "7:30 PM"
  });
}