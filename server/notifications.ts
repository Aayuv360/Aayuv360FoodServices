import { ObjectId } from "mongodb";
import { connectToMongoDB, disconnectFromMongoDB } from "./db";
import express from "express";
import { authenticateToken } from "./jwt-middleware";
export const router = express.Router();
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
  if (!db) {
    throw new Error("Database connection failed");
  }
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
  if (!db) {
    throw new Error("Database connection failed");
  }
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
  if (!db) {
    throw new Error("Database connection failed");
  }
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
  if (!db) {
    throw new Error("Database connection failed");
  }
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

router.get(
  "/api/notifications/user/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const notifications = await getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  },
);

// Create a new notification
router.post("/api/notifications", authenticateToken, async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    if (!userId || !title || !message || !type) {
      return res
        .status(400)
        .json({ error: "userId, title, message, and type are required" });
    }

    const validTypes = ["app", "sms", "whatsapp"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid notification type" });
    }

    const notification = await createNotification({
      userId,
      title,
      message,
      type,
    });
    res.json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// Mark a notification as read
router.put(
  "/api/notifications/:notificationId/read",
  authenticateToken,
  async (req, res) => {
    try {
      const notificationId = parseInt(req.params.notificationId);
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }

      const notification = await markNotificationAsRead(notificationId);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  },
);

// Mark all notifications as read for a user
router.put(
  "/api/notifications/user/:userId/read-all",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const count = await markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read", count });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res
        .status(500)
        .json({ error: "Failed to mark all notifications as read" });
    }
  },
);

// Send app notification
router.post(
  "/api/notifications/send/app",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId, title, message } = req.body;

      if (!userId || !title || !message) {
        return res
          .status(400)
          .json({ error: "userId, title, and message are required" });
      }

      const notification = await sendAppNotification(userId, title, message);
      res.json(notification);
    } catch (error) {
      console.error("Error sending app notification:", error);
      res.status(500).json({ error: "Failed to send app notification" });
    }
  },
);

// Send SMS notification
router.post(
  "/api/notifications/send/sms",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId, title, message } = req.body;

      if (!userId || !title || !message) {
        return res
          .status(400)
          .json({ error: "userId, title, and message are required" });
      }

      const notification = await sendSmsNotification(userId, title, message);
      res.json(notification);
    } catch (error) {
      console.error("Error sending SMS notification:", error);
      res.status(500).json({ error: "Failed to send SMS notification" });
    }
  },
);

// Send WhatsApp notification
router.post(
  "/api/notifications/send/whatsapp",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId, title, message } = req.body;

      if (!userId || !title || !message) {
        return res
          .status(400)
          .json({ error: "userId, title, and message are required" });
      }

      const notification = await sendWhatsAppNotification(
        userId,
        title,
        message,
      );
      res.json(notification);
    } catch (error) {
      console.error("Error sending WhatsApp notification:", error);
      res.status(500).json({ error: "Failed to send WhatsApp notification" });
    }
  },
);
