import { connectToMongoDB } from "./db";
import { mongoStorage } from "./mongoStorage";
import {
  sendAppNotification,
  sendSmsNotification,
  sendWhatsAppNotification,
} from "./notifications";
import { sendSubscriptionDeliveryEmail } from "./email-service";
import { smsService } from "./sms-service";

interface SubscriptionDeliveryItem {
  subscriptionId: number;
  userId: number;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  mainMeal: string;
  sides: string[];
  deliveryTime: string; // "7:30 PM"
  notificationTime: string; // "6:00 PM"
}

export async function getTodaySubscriptionDeliveries(): Promise<
  SubscriptionDeliveryItem[]
> {
  try {
    const { db } = await connectToMongoDB();
    if (!db) throw new Error("Failed to connect to MongoDB");

    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayStart.getDate() + 1);

    const subscriptions = await mongoStorage.getAllSubscriptions();
    const activeSubscriptions = subscriptions.filter((sub: any) => {
      const startDate = new Date(sub.startDate);
      const endDate = sub.endDate
        ? new Date(sub.endDate)
        : new Date(
            startDate.getTime() + sub.mealsPerMonth * 24 * 60 * 60 * 1000,
          );

      return (
        sub.status === "active" &&
        startDate <= today &&
        endDate > today &&
        sub.menuItems &&
        sub.menuItems.length > 0
      );
    });

    const deliveryItems: SubscriptionDeliveryItem[] = [];

    for (const subscription of activeSubscriptions) {
      const user = await mongoStorage.getUser(subscription.userId);
      if (!user) continue;

      const startDate = new Date(subscription.startDate);
      const dayDiff = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const dayOfWeek = dayDiff % 7; // 0-6 for 7 days cycle

      const todayMenuItem = subscription.menuItems.find(
        (item: any) => item.day === dayOfWeek + 1,
      );

      if (todayMenuItem) {
        deliveryItems.push({
          subscriptionId: subscription.id,
          userId: subscription.userId,
          userName: user.name || user.username,
          userEmail: user.email,
          userPhone: user.phone,
          mainMeal: todayMenuItem.main,
          sides: todayMenuItem.sides || [],
          deliveryTime: "7:30 PM",
          notificationTime: "7:5 PM",
        });
      }
    }
    console.log(deliveryItems);
    return deliveryItems;
  } catch (error) {
    console.error("Error getting today's subscription deliveries:", error);
    return [];
  }
}

export async function sendDailyDeliveryNotifications(): Promise<{
  sent: number;
  failed: number;
}> {
  let sent = 0;
  let failed = 0;

  try {
    const deliveryItems = await getTodaySubscriptionDeliveries();

    for (const item of deliveryItems) {
      try {
        const sidesText =
          item.sides.length > 0 ? ` with ${item.sides.join(", ")}` : "";
        const message = `Your subscription meal for today: ${item.mainMeal}${sidesText}. Delivery at ${item.deliveryTime}.`;

        await sendAppNotification(
          item.userId,
          "Today's Meal Delivery",
          message,
        );

        if (item.userEmail) {
          await sendSubscriptionDeliveryEmail({
            userEmail: item.userEmail,
            userName: item.userName,
            mainMeal: item.mainMeal,
            sides: item.sides,
            deliveryTime: item.deliveryTime,
          });
        }

        // Get subscription details for delivery address
        const subscription = await mongoStorage.getSubscription(
          item.subscriptionId,
        );
        const deliveryAddress =
          subscription && subscription.deliveryAddressId
            ? await mongoStorage.getAddressById(subscription.deliveryAddressId)
            : null;
        const deliveryPhone = deliveryAddress?.phone || item.userPhone;

        if (deliveryPhone) {
          await smsService.sendSubscriptionDeliveryNotification(
            deliveryPhone,
            item.userName,
            item.mainMeal,
            item.sides,
            item.deliveryTime,
          );
        }

        console.log(
          `Sent delivery notification to user ${item.userId} for subscription ${item.subscriptionId}`,
        );
        sent++;
      } catch (error) {
        console.error(
          `Failed to send notification for subscription ${item.subscriptionId}:`,
          error,
        );
        failed++;
      }
    }

    console.log(
      `Daily delivery notifications completed: ${sent} sent, ${failed} failed`,
    );
    return { sent, failed };
  } catch (error) {
    console.error("Error sending daily delivery notifications:", error);
    return { sent: 0, failed: 1 };
  }
}

export function scheduleDailyNotifications() {
  const now = new Date();
  const target = new Date();
  target.setHours(19, 5, 0, 0);

  if (now > target) {
    target.setDate(target.getDate() + 1);
  }

  const msUntilTarget = target.getTime() - now.getTime();

  console.log(
    `Next daily notification scheduled for: ${target.toLocaleString()}`,
  );

  setTimeout(() => {
    sendDailyDeliveryNotifications();

    setInterval(
      () => {
        sendDailyDeliveryNotifications();
      },
      24 * 60 * 60 * 1000,
    );
  }, msUntilTarget);
}

export async function sendTestSubscriptionNotification(
  userId: number,
): Promise<boolean> {
  try {
    const user = await mongoStorage.getUser(userId);
    if (!user) return false;

    const message =
      "Test: Your subscription meal for today: Millet Khichdi with Dal and Vegetables. Delivery at 7:30 PM.";

    await sendAppNotification(userId, "Today's Meal Delivery (Test)", message);

    console.log(`Sent test subscription notification to user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error sending test subscription notification:", error);
    return false;
  }
}
