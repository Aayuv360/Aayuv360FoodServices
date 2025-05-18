import { ObjectId } from "mongodb";
import { connectToMongoDB, disconnectFromMongoDB } from "./db";

export interface Notification {
  _id?: ObjectId;
  id: number;
  userId: number;
  title: string;
  message: string;
  type: "app" | "sms" | "whatsapp";
  read: boolean;
  createdAt: Date;
}

export async function createNotification(
  notificationData: Omit<Notification, "id" | "read" | "createdAt">,
): Promise<Notification> {
  const { db } = await connectToMongoDB();
  const notificationsCollection = db.collection("notifications");

  const maxIdDoc = await notificationsCollection
    .find({})
    .sort({ id: -1 })
    .limit(1)
    .toArray();

  const nextId = maxIdDoc.length > 0 ? maxIdDoc[0].id + 1 : 1;

  const notification: Notification = {
    id: nextId,
    ...notificationData,
    read: false,
    createdAt: new Date(),
  };

  await notificationsCollection.insertOne(notification);
  return notification;
}

export async function getUserNotifications(
  userId: number,
): Promise<Notification[]> {
  const { db } = await connectToMongoDB();
  const notificationsCollection = db.collection("notifications");

  const notifications = await notificationsCollection
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  return notifications as Notification[];
}

export async function markNotificationAsRead(
  notificationId: number,
): Promise<Notification | null> {
  const { db } = await connectToMongoDB();
  const notificationsCollection = db.collection("notifications");

  const result = await notificationsCollection.findOneAndUpdate(
    { id: notificationId },
    { $set: { read: true } },
    { returnDocument: "after" },
  );

  if (!result) return null;
  return result as unknown as Notification;
}

export async function markAllNotificationsAsRead(
  userId: number,
): Promise<number> {
  const { db } = await connectToMongoDB();
  const notificationsCollection = db.collection("notifications");

  const result = await notificationsCollection.updateMany(
    { userId, read: false },
    { $set: { read: true } },
  );

  return result.modifiedCount;
}

export async function sendAppNotification(
  userId: number,
  title: string,
  message: string,
): Promise<Notification> {
  return createNotification({
    userId,
    title,
    message,
    type: "app",
  });
}

export async function sendSmsNotification(
  userId: number,
  title: string,
  message: string,
): Promise<Notification> {
  return createNotification({
    userId,
    title,
    message,
    type: "sms",
  });
}

export async function sendWhatsAppNotification(
  userId: number,
  title: string,
  message: string,
): Promise<Notification> {
  return createNotification({
    userId,
    title,
    message,
    type: "whatsapp",
  });
}
