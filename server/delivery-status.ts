import { ObjectId } from "mongodb";
import { connectToMongoDB } from "./db";
import { sendAppNotification, sendSmsNotification, sendWhatsAppNotification } from "./notifications";
import { getCurrentISTDate } from "./timezone-utils";

export interface DeliveryStatus {
  _id?: ObjectId;
  id: number;
  orderId: number;
  userId: number;
  status: 'preparing' | 'in_transit' | 'out_for_delivery' | 'nearby' | 'delivered';
  message: string;
  estimatedTime?: string;
  location?: string;
  timestamp: Date;
}

/**
 * Get delivery status updates for a user
 * @param userId User ID
 * @returns List of delivery status updates
 */
export async function getUserDeliveryStatusUpdates(userId: number): Promise<DeliveryStatus[]> {
  const { db } = await connectToMongoDB();
  if (!db) throw new Error("Failed to connect to MongoDB");

  // Get user's recent orders (including recently delivered ones)
  const ordersCollection = db.collection("orders");
  const recentOrders = await ordersCollection
    .find({ 
      userId,
      status: { $nin: ["cancelled"] } // Include delivered orders but exclude cancelled
    })
    .sort({ createdAt: -1 })
    .toArray();

  if (recentOrders.length === 0) {
    return [];
  }

  const deliveryCollection = db.collection("deliveryStatus");

  // Get latest delivery status for each recent order
  const latestUpdates: DeliveryStatus[] = [];

  for (const order of recentOrders) {
    const latestStatus = await deliveryCollection
      .findOne(
        { orderId: order.id },
        { sort: { timestamp: -1 } }
      );

    if (latestStatus) {
      // Show delivered status for orders delivered within the last 2 hours
      if (latestStatus.status === "delivered") {
        const deliveredTime = new Date(latestStatus.timestamp);
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

        if (deliveredTime > twoHoursAgo) {
          latestUpdates.push(latestStatus as DeliveryStatus);
        }
      } else {
        latestUpdates.push(latestStatus as DeliveryStatus);
      }
    } else {
      // If no delivery status exists, create one based on order status
      const deliveryStatus = mapOrderStatusToDeliveryStatus(order.status);
      if (deliveryStatus) {
        const newStatus = await createDeliveryStatusForOrder(order.id, userId, deliveryStatus);
        latestUpdates.push(newStatus);
      }
    }
  }

  return latestUpdates;
}

function mapOrderStatusToDeliveryStatus(orderStatus: string): 'preparing' | 'in_transit' | 'out_for_delivery' | 'nearby' | 'delivered' | null {
  switch (orderStatus) {
    case 'confirmed':
    case 'preparing':
      return 'preparing';
    case 'in_transit':
      return 'in_transit';
    case 'out_for_delivery':
      return 'out_for_delivery';
    case 'nearby':
      return 'nearby';
    case 'delivered':
      return 'delivered';
    default:
      return null;
  }
}

async function createDeliveryStatusForOrder(
  orderId: number, 
  userId: number, 
  status: 'preparing' | 'in_transit' | 'out_for_delivery' | 'nearby' | 'delivered'
): Promise<DeliveryStatus> {
  const { db } = await connectToMongoDB();
  if (!db) throw new Error("Failed to connect to MongoDB");

  const deliveryCollection = db.collection("deliveryStatus");
  const maxIdDoc = await deliveryCollection.find().sort({ id: -1 }).limit(1).toArray();
  const nextId = maxIdDoc.length > 0 ? maxIdDoc[0].id + 1 : 1;

  let message = "";
  let estimatedTime = "";

  switch (status) {
    case 'preparing':
      message = "Your order is being prepared in our kitchen.";
      estimatedTime = "30-45 minutes";
      break;
    case 'in_transit':
      message = "Your order is in transit to delivery partner.";
      estimatedTime = "20-30 minutes";
      break;
    case 'out_for_delivery':
      message = "Your order is out for delivery.";
      estimatedTime = "15-25 minutes";
      break;
    case 'nearby':
      message = "Your delivery is nearby.";
      estimatedTime = "3-5 minutes";
      break;
    case 'delivered':
      message = "Your order has been delivered. Enjoy!";
      break;
  }

  const statusUpdate: DeliveryStatus = {
    id: nextId,
    orderId,
    userId,
    status,
    message,
    estimatedTime,
    timestamp: getCurrentISTDate()
  };

  await deliveryCollection.insertOne(statusUpdate);
  return statusUpdate;
}

/**
 * Get delivery status updates for an order
 * @param orderId Order ID
 * @returns List of delivery status updates
 */
export async function getOrderDeliveryStatusUpdates(orderId: number): Promise<DeliveryStatus[]> {
  const { db } = await connectToMongoDB();
  if (!db) throw new Error("Failed to connect to MongoDB");

  const deliveryCollection = db.collection("deliveryStatus");

  const statusUpdates = await deliveryCollection
    .find({ orderId })
    .sort({ timestamp: -1 })
    .toArray();

  return statusUpdates as DeliveryStatus[];
}

/**
 * Create a delivery status update
 * @param statusData Delivery status data
 * @param notificationMethods Notification methods to use
 * @returns Created delivery status
 */
export async function createDeliveryStatusUpdate(
  statusData: Omit<DeliveryStatus, "id" | "timestamp">,
  notificationMethods: { app?: boolean; sms?: boolean; whatsapp?: boolean } = { app: true }
): Promise<DeliveryStatus> {
  const { db } = await connectToMongoDB();
  if (!db) throw new Error("Failed to connect to MongoDB");

  const deliveryCollection = db.collection("deliveryStatus");

  // Find the highest ID in the collection
  const maxIdDoc = await deliveryCollection
    .find({})
    .sort({ id: -1 })
    .limit(1)
    .toArray();

  const nextId = maxIdDoc.length > 0 ? maxIdDoc[0].id + 1 : 1;

  const statusUpdate: DeliveryStatus = {
    id: nextId,
    ...statusData,
    timestamp: getCurrentISTDate()
  };

  await deliveryCollection.insertOne(statusUpdate);

  // Send notifications based on the selected methods
  try {
    // Create notification title based on status
    let title = `Order #${statusData.orderId} Update`;

    if (notificationMethods.app) {
      await sendAppNotification(statusData.userId, title, statusData.message);
    }

    if (notificationMethods.sms) {
      await sendSmsNotification(statusData.userId, title, statusData.message);
    }

    if (notificationMethods.whatsapp) {
      await sendWhatsAppNotification(statusData.userId, title, statusData.message);
    }
  } catch (error) {
    console.error("Failed to send notifications:", error);
  }

  return statusUpdate;
}

/**
 * Update order status and create delivery notification
 * @param orderId Order ID
 * @param userId User ID
 * @param status New delivery status
 * @param customMessage Optional custom message
 * @returns Created delivery status
 */
export async function updateOrderDeliveryStatus(
  orderId: number,
  userId: number,
  status: 'preparing' | 'in_transit' | 'out_for_delivery' | 'nearby' | 'delivered',
  customMessage?: string
): Promise<DeliveryStatus> {
  // Generate appropriate message based on status
  let message = customMessage;
  let estimatedTime: string | undefined;

  if (!message) {
    switch (status) {
      case 'preparing':
        message = "Your order is being prepared in our kitchen.";
        estimatedTime = "30-45 minutes until delivery";
        break;
      case 'in_transit':
        message = "Your order is in transit to our delivery partner.";
        estimatedTime = "20-30 minutes until delivery";
        break;
      case 'out_for_delivery':
        message = "Your order is on the way! Our delivery partner has picked it up.";
        estimatedTime = "15-25 minutes until delivery";
        break;
      case 'nearby':
        message = "Your delivery is nearby! It will arrive within a few minutes.";
        estimatedTime = "3-5 minutes until delivery";
        break;
      case 'delivered':
        message = "Your order has been delivered. Enjoy your meal!";
        break;
    }
  }

  // Create delivery status update
  return createDeliveryStatusUpdate(
    {
      orderId,
      userId,
      status,
      message: message || "Order status updated",
      estimatedTime
    },
    { app: true, sms: true, whatsapp: false } // Default to app and SMS, but not WhatsApp
  );
}

async function sendDeliveryNotifications(
  deliveryStatus: DeliveryStatus,
  options: { app?: boolean; sms?: boolean; whatsapp?: boolean } = {}
): Promise<void> {
  const { app = true, sms = true, whatsapp = false } = options;

  try {
    const { mongoStorage } = await import("./mongoStorage");
    const { smsService } = await import("./sms-service");

    // Get order and user details
    const order = await mongoStorage.getOrder(deliveryStatus.orderId);
    const user = await mongoStorage.getUser(deliveryStatus.userId);

    if (app) {
      await sendAppNotification(
        deliveryStatus.userId,
        `Order #${deliveryStatus.orderId} Update`,
        deliveryStatus.message
      );
    }

    if (sms && order && user) {
      // Get delivery address phone number
      let deliveryPhone = null;

      if (order.deliveryAddress?.phone) {
        deliveryPhone = order.deliveryAddress.phone;
      } else if (order.deliveryAddressId) {
        const deliveryAddress = await mongoStorage.getAddressById(order.deliveryAddressId);
        deliveryPhone = deliveryAddress?.phone;
      }

      // Fallback to user phone if no delivery address phone
      if (!deliveryPhone && user.phone) {
        deliveryPhone = user.phone;
      }

      if (deliveryPhone) {
        const userName = user.name || user.username || 'Customer';
        await smsService.sendOrderStatusNotification(
          deliveryPhone,
          userName,
          deliveryStatus.orderId,
          deliveryStatus.status,
          deliveryStatus.estimatedTime
        );
      }

      // Also send app notification for SMS type
      await sendSmsNotification(
        deliveryStatus.userId,
        `Order #${deliveryStatus.orderId} Update`,
        deliveryStatus.message
      );
    }

    if (whatsapp) {
      await sendWhatsAppNotification(
        deliveryStatus.userId,
        `Order #${deliveryStatus.orderId} Update`,
        deliveryStatus.message
      );
    }
  } catch (error) {
    console.error("Error sending delivery notifications:", error);
  }
}

// Export router for use in index.ts
import express from 'express';
export const router = express.Router();

// Simple authentication middleware placeholder
const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};

// Get delivery status updates for a user
router.get('/api/delivery-status/user/:userId', isAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const deliveryUpdates = await getUserDeliveryStatusUpdates(userId);
    res.json(deliveryUpdates);
  } catch (error) {
    console.error('Error fetching delivery status:', error);
    res.status(500).json({ error: 'Failed to fetch delivery status' });
  }
});

// Get delivery status for a specific order
router.get('/api/delivery-status/order/:orderId', isAuthenticated, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const deliveryUpdates = await getOrderDeliveryStatusUpdates(orderId);
    res.json(deliveryUpdates);
  } catch (error) {
    console.error('Error fetching order delivery status:', error);
    res.status(500).json({ error: 'Failed to fetch order delivery status' });
  }
});

// Create/update delivery status (admin only)
router.post('/api/delivery-status', isAuthenticated, async (req, res) => {
  try {
    // Add admin check here
    const { orderId, userId, status, customMessage } = req.body;

    if (!orderId || !userId || !status) {
      return res.status(400).json({ error: 'orderId, userId, and status are required' });
    }

    const validStatuses = ['preparing', 'in_transit', 'out_for_delivery', 'nearby', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const deliveryStatus = await updateOrderDeliveryStatus(orderId, userId, status, customMessage);
    res.json(deliveryStatus);
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
});

// Create delivery status update with custom notifications
router.post('/api/delivery-status/create', isAuthenticated, async (req, res) => {
  try {
    const { orderId, userId, status, message, estimatedTime, notificationMethods } = req.body;

    if (!orderId || !userId || !status || !message) {
      return res.status(400).json({ error: 'orderId, userId, status, and message are required' });
    }

    const deliveryStatus = await createDeliveryStatusUpdate(
      { orderId, userId, status, message, estimatedTime },
      notificationMethods || { app: true }
    );

    res.json(deliveryStatus);
  } catch (error) {
    console.error('Error creating delivery status:', error);
    res.status(500).json({ error: 'Failed to create delivery status' });
  }
});