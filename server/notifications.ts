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

/**
 * Create a notification
 * @param notification Notification data
 * @returns Created notification
 */
export async function createNotification(notificationData: Omit<Notification, "id" | "read" | "createdAt">): Promise<Notification> {
  const { db } = await connectToMongoDB();
  const notificationsCollection = db.collection("notifications");
  
  // Find the highest ID in the collection
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
    createdAt: new Date()
  };
  
  await notificationsCollection.insertOne(notification);
  return notification;
}

/**
 * Get notifications for a user
 * @param userId User ID
 * @returns List of notifications
 */
export async function getUserNotifications(userId: number): Promise<Notification[]> {
  const { db } = await connectToMongoDB();
  const notificationsCollection = db.collection("notifications");
  
  const notifications = await notificationsCollection
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  
  return notifications as Notification[];
}

/**
 * Mark a notification as read
 * @param notificationId Notification ID
 * @returns Updated notification
 */
export async function markNotificationAsRead(notificationId: number): Promise<Notification | null> {
  const { db } = await connectToMongoDB();
  const notificationsCollection = db.collection("notifications");
  
  const result = await notificationsCollection.findOneAndUpdate(
    { id: notificationId },
    { $set: { read: true } },
    { returnDocument: "after" }
  );
  
  if (!result) return null;
  return result as unknown as Notification;
}

/**
 * Mark all notifications as read for a user
 * @param userId User ID
 * @returns Number of updated notifications
 */
export async function markAllNotificationsAsRead(userId: number): Promise<number> {
  const { db } = await connectToMongoDB();
  const notificationsCollection = db.collection("notifications");
  
  const result = await notificationsCollection.updateMany(
    { userId, read: false },
    { $set: { read: true } }
  );
  
  return result.modifiedCount;
}

/**
 * Send an app notification to a user
 * @param userId User ID
 * @param title Notification title
 * @param message Notification message
 * @returns Created notification
 */
export async function sendAppNotification(userId: number, title: string, message: string): Promise<Notification> {
  return createNotification({
    userId,
    title,
    message,
    type: "app"
  });
}

/**
 * Send an SMS notification to a user
 * @param userId User ID
 * @param title Notification title
 * @param message Notification message
 * @returns Created notification
 */
export async function sendSmsNotification(userId: number, title: string, message: string): Promise<Notification> {
  // Here you would integrate with an SMS service like Twilio
  // For now, we're just storing the notification
  return createNotification({
    userId,
    title,
    message,
    type: "sms"
  });
}

/**
 * Send a WhatsApp notification to a user
 * @param userId User ID
 * @param title Notification title
 * @param message Notification message
 * @returns Created notification
 */
export async function sendWhatsAppNotification(userId: number, title: string, message: string): Promise<Notification> {
  // Here you would integrate with WhatsApp Business API
  // For now, we're just storing the notification
  return createNotification({
    userId,
    title,
    message,
    type: "whatsapp"
  });
}