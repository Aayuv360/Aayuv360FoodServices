import { connectToMongoDB } from "./db";
import { mongoStorage } from "./mongoStorage";
import {
  sendAppNotification,
  sendSmsNotification,
  sendWhatsAppNotification,
} from "./notifications";
import { sendSubscriptionDeliveryEmail } from "./email-service";
import { smsService } from "./sms-service";
import { DateTime } from "luxon";

interface SubscriptionDeliveryItem {
  subscriptionId: number;
  userId: number;
  userEmail?: string;
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
          userEmail: user.email,
          mainMeal: todayMenuItem.main,
          sides: todayMenuItem.sides || [],
          deliveryTime: "8:30 PM",
          notificationTime: "11:14 PM",
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
        const subscription = await mongoStorage.getSubscription(
          item.subscriptionId,
        );
        const deliveryAddress = await mongoStorage.getAddressById(
          subscription.deliveryAddressId,
        );
        if (item.userEmail) {
          await sendSubscriptionDeliveryEmail({
            userEmail: item.userEmail,
            userName: deliveryAddress.userName,
            mainMeal: item.mainMeal,
            sides: item.sides,
            deliveryTime: item.deliveryTime,
          });
        }

        const deliveryPhone = deliveryAddress?.phone;
        const formattedPhone = deliveryPhone.startsWith("+")
          ? deliveryPhone
          : `+91${deliveryPhone}`;

        if (deliveryPhone) {
          await smsService.sendSubscriptionDeliveryNotification(
            formattedPhone,
            deliveryAddress.userName,
            item.mainMeal,
            item.sides,
            item.deliveryTime,
          );
        }

        sent++;
      } catch (error) {
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
  const now = DateTime.utc();
  const istNow = now.setZone("Asia/Kolkata");

  let target = istNow.set({ hour: 23, minute: 14, second: 0, millisecond: 0 });

  if (istNow > target) {
    target = target.plus({ days: 1 });
  }

  const msUntilTarget = target.toUTC().toMillis() - now.toMillis();

  setTimeout(() => {
    sendDailyDeliveryNotifications();

    setInterval(sendDailyDeliveryNotifications, 24 * 60 * 60 * 1000);
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
