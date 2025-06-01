import { ObjectId } from "mongodb";
import { connectToMongoDB } from "./db";
import { sendAppNotification, sendSmsNotification, sendWhatsAppNotification } from "./notifications";

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
  
  const deliveryCollection = db.collection("deliveryStatus");
  
  // Only get delivery status for orders that are not delivered or cancelled
  const statusUpdates = await deliveryCollection
    .find({ 
      userId,
      status: { $nin: ["delivered", "cancelled"] } // Exclude delivered and cancelled orders
    })
    .sort({ timestamp: -1 })
    .toArray();
  
  // Group by orderId and return only the latest status for each order
  const latestUpdates: Record<number, DeliveryStatus> = {};
  statusUpdates.forEach((update: any) => {
    if (!latestUpdates[update.orderId] || 
        new Date(update.timestamp) > new Date(latestUpdates[update.orderId].timestamp)) {
      latestUpdates[update.orderId] = update;
    }
  });
  
  return Object.values(latestUpdates) as DeliveryStatus[];
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
    timestamp: new Date()
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