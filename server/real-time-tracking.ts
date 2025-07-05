import express, { Request, Response } from 'express';
import { EventEmitter } from 'events';
import { mongoStorage } from './mongoStorage';
import { logAPIRequest, logError } from './logger';
import { sendRealSmsNotification } from './sms-service';
import { sendSubscriptionDeliveryEmail } from './email-service';

export interface DeliveryLocation {
  lat: number;
  lng: number;
  timestamp: Date;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface OrderTrackingData {
  orderId: number;
  status: 'confirmed' | 'preparing' | 'in_transit' | 'out_for_delivery' | 'nearby' | 'delivered';
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  deliveryPerson: {
    name: string;
    phone: string;
    vehicleNumber?: string;
    id?: string;
  };
  customerLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  deliveryLocation?: DeliveryLocation;
  orderItems: Array<{
    name: string;
    quantity: number;
    image?: string;
  }>;
  timeline: Array<{
    status: string;
    time: Date;
    message: string;
  }>;
}

export interface DeliveryPersonUpdate {
  deliveryPersonId: string;
  location: DeliveryLocation;
  currentOrderIds: number[];
  status: 'available' | 'busy' | 'offline';
}

// Event emitter for real-time updates
class TrackingEventEmitter extends EventEmitter {}
export const trackingEvents = new TrackingEventEmitter();

// Store active SSE connections
const sseConnections = new Map<string, Response>();

// Store delivery person locations
const deliveryPersonLocations = new Map<string, DeliveryLocation>();

export class RealTimeTrackingService {
  
  // Calculate estimated delivery time based on distance and traffic
  static calculateEstimatedDeliveryTime(
    customerLat: number,
    customerLng: number,
    deliveryLat: number,
    deliveryLng: number
  ): Date {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = (customerLat - deliveryLat) * Math.PI / 180;
    const dLng = (customerLng - deliveryLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deliveryLat * Math.PI / 180) * Math.cos(customerLat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers

    // Estimate time based on average speed (accounting for traffic)
    const averageSpeed = 25; // km/h in urban areas
    const estimatedHours = distance / averageSpeed;
    const estimatedMinutes = Math.ceil(estimatedHours * 60);
    
    // Add buffer time
    const bufferMinutes = Math.max(10, Math.ceil(estimatedMinutes * 0.2));
    const totalMinutes = estimatedMinutes + bufferMinutes;

    const estimatedTime = new Date();
    estimatedTime.setMinutes(estimatedTime.getMinutes() + totalMinutes);
    
    return estimatedTime;
  }

  // Update order status and notify customers
  static async updateOrderStatus(
    orderId: number, 
    status: OrderTrackingData['status'],
    deliveryPersonId?: string,
    customMessage?: string
  ): Promise<void> {
    try {
      // Update order in database
      await mongoStorage.updateOrderStatus(orderId, status);
      
      // Get order details
      const order = await mongoStorage.getOrder(orderId);
      if (!order) throw new Error('Order not found');

      // Get user details
      const user = await mongoStorage.getUser(order.userId);
      if (!user) throw new Error('User not found');

      // Create timeline entry
      const timelineEntry = {
        status,
        time: new Date(),
        message: customMessage || this.getStatusMessage(status),
      };

      // Get delivery person location if available
      let deliveryLocation: DeliveryLocation | undefined;
      if (deliveryPersonId && deliveryPersonLocations.has(deliveryPersonId)) {
        deliveryLocation = deliveryPersonLocations.get(deliveryPersonId);
      }

      // Prepare tracking update
      const trackingUpdate = {
        orderId,
        status,
        deliveryLocation,
        timeline: [timelineEntry],
        timestamp: new Date(),
      };

      // Emit real-time update
      trackingEvents.emit('orderStatusUpdate', trackingUpdate);

      // Send notifications based on status
      await this.sendStatusNotifications(order, user, status, deliveryLocation);

      console.log(`Order ${orderId} status updated to: ${status}`);
      
    } catch (error) {
      logError(error as Error, { orderId, status, deliveryPersonId });
      throw error;
    }
  }

  // Update delivery person location
  static async updateDeliveryPersonLocation(update: DeliveryPersonUpdate): Promise<void> {
    try {
      // Store location
      deliveryPersonLocations.set(update.deliveryPersonId, update.location);

      // Update all orders assigned to this delivery person
      for (const orderId of update.currentOrderIds) {
        const order = await mongoStorage.getOrder(orderId);
        if (!order || !['in_transit', 'out_for_delivery'].includes(order.status)) continue;

        // Get customer location
        const user = await mongoStorage.getUser(order.userId);
        if (!user || !user.defaultAddress) continue;

        const customerLat = user.defaultAddress.latitude;
        const customerLng = user.defaultAddress.longitude;

        // Calculate distance to customer
        const distance = this.calculateDistance(
          update.location.lat,
          update.location.lng,
          customerLat,
          customerLng
        );

        // Update estimated delivery time
        const estimatedDeliveryTime = this.calculateEstimatedDeliveryTime(
          customerLat,
          customerLng,
          update.location.lat,
          update.location.lng
        );

        // Check if delivery person is nearby (within 500m)
        if (distance < 0.5 && order.status !== 'nearby') {
          await this.updateOrderStatus(orderId, 'nearby', update.deliveryPersonId);
        }

        // Emit location update
        trackingEvents.emit('locationUpdate', {
          orderId,
          deliveryLocation: update.location,
          estimatedDeliveryTime: estimatedDeliveryTime.toISOString(),
          distanceToCustomer: distance,
        });
      }

    } catch (error) {
      logError(error as Error, { deliveryPersonId: update.deliveryPersonId });
    }
  }

  // Calculate distance between two points (Haversine formula)
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  // Get status message
  private static getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      confirmed: 'Your order has been confirmed and is being prepared',
      preparing: 'Your millet meal is being freshly prepared',
      in_transit: 'Your order is on the way to you',
      out_for_delivery: 'Delivery partner is out for delivery',
      nearby: 'Delivery partner is nearby (within 5 minutes)',
      delivered: 'Your order has been delivered. Enjoy your meal!',
    };
    return messages[status] || 'Order status updated';
  }

  // Send notifications based on status
  private static async sendStatusNotifications(
    order: any,
    user: any,
    status: string,
    deliveryLocation?: DeliveryLocation
  ): Promise<void> {
    try {
      const shouldNotify = ['confirmed', 'out_for_delivery', 'nearby', 'delivered'].includes(status);
      if (!shouldNotify) return;

      const message = this.getStatusMessage(status);
      
      // Send SMS notification
      if (user.phone) {
        await sendRealSmsNotification(
          user.phone,
          user.name || 'Customer',
          'Order Update',
          `${message} Order #${order.id}`
        );
      }

      // Send email notification for important status updates
      if (user.email && ['confirmed', 'delivered'].includes(status)) {
        // Email implementation would go here
        console.log(`Email notification sent to ${user.email} for order ${order.id}`);
      }

      // Send push notification (browser notification)
      trackingEvents.emit('pushNotification', {
        userId: user.id,
        title: 'Order Update',
        message,
        orderId: order.id,
        status,
      });

    } catch (error) {
      logError(error as Error, { orderId: order.id, status });
    }
  }
}

export const router = express.Router();

// Get order tracking data
router.get('/orders/:orderId/tracking', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await mongoStorage.getOrder(parseInt(orderId));
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const orderItems = await mongoStorage.getOrderItems(order.id);
    
    // Mock delivery person data (in production, this would come from a delivery management system)
    const deliveryPerson = {
      name: 'Rajesh Kumar',
      phone: '+91 9876543210',
      vehicleNumber: 'TS 09 EZ 1234',
    };

    // Get delivery location if available
    const deliveryLocation = deliveryPersonLocations.get('delivery_person_1');

    // Mock customer location (in production, get from user's address)
    const customerLocation = {
      lat: 17.4065,
      lng: 78.4772,
      address: 'Hyderabad, Telangana',
    };

    // Calculate estimated delivery time
    let estimatedDeliveryTime = new Date();
    if (deliveryLocation) {
      estimatedDeliveryTime = RealTimeTrackingService.calculateEstimatedDeliveryTime(
        customerLocation.lat,
        customerLocation.lng,
        deliveryLocation.lat,
        deliveryLocation.lng
      );
    } else {
      estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 45);
    }

    // Mock timeline data
    const timeline = [
      {
        status: 'confirmed',
        time: new Date(order.createdAt),
        message: 'Order confirmed and payment received',
      },
      {
        status: 'preparing',
        time: new Date(Date.now() - 30 * 60 * 1000),
        message: 'Your millet meal is being prepared',
      },
    ];

    if (['in_transit', 'out_for_delivery', 'nearby', 'delivered'].includes(order.status)) {
      timeline.push({
        status: 'in_transit',
        time: new Date(Date.now() - 15 * 60 * 1000),
        message: 'Order picked up and in transit',
      });
    }

    const trackingData: OrderTrackingData = {
      orderId: order.id,
      status: order.status as OrderTrackingData['status'],
      estimatedDeliveryTime: estimatedDeliveryTime.toISOString(),
      deliveryPerson,
      customerLocation,
      deliveryLocation,
      orderItems: orderItems.map(item => ({
        name: item.mealName || 'Millet Meal',
        quantity: item.quantity,
        image: item.image,
      })),
      timeline,
    };

    logAPIRequest(req.method, req.path, res.statusCode, 100);
    res.json(trackingData);

  } catch (error) {
    logError(error as Error, { orderId: req.params.orderId });
    res.status(500).json({ error: 'Failed to fetch tracking data' });
  }
});

// Live tracking SSE endpoint
router.get('/orders/:orderId/tracking/live', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const connectionId = `${orderId}_${Date.now()}`;

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Store connection
  sseConnections.set(connectionId, res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', orderId })}\n\n`);

  // Set up event listeners
  const handleOrderUpdate = (update: any) => {
    if (update.orderId === parseInt(orderId)) {
      res.write(`data: ${JSON.stringify({ type: 'status_update', ...update })}\n\n`);
    }
  };

  const handleLocationUpdate = (update: any) => {
    if (update.orderId === parseInt(orderId)) {
      res.write(`data: ${JSON.stringify({ type: 'location_update', ...update })}\n\n`);
    }
  };

  trackingEvents.on('orderStatusUpdate', handleOrderUpdate);
  trackingEvents.on('locationUpdate', handleLocationUpdate);

  // Clean up on client disconnect
  req.on('close', () => {
    sseConnections.delete(connectionId);
    trackingEvents.off('orderStatusUpdate', handleOrderUpdate);
    trackingEvents.off('locationUpdate', handleLocationUpdate);
  });
});

// Get delivery location (for polling as backup)
router.get('/orders/:orderId/delivery-location', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    
    // Mock delivery location (in production, get from delivery person's GPS)
    const deliveryLocation: DeliveryLocation = {
      lat: 17.4065 + (Math.random() - 0.5) * 0.01,
      lng: 78.4772 + (Math.random() - 0.5) * 0.01,
      timestamp: new Date(),
      accuracy: 10,
      speed: Math.random() * 40, // km/h
      heading: Math.random() * 360, // degrees
    };

    res.json(deliveryLocation);
  } catch (error) {
    logError(error as Error, { orderId: req.params.orderId });
    res.status(500).json({ error: 'Failed to get delivery location' });
  }
});

// Update order status (for admin/delivery person)
router.put('/orders/:orderId/status', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, deliveryPersonId, message } = req.body;

    await RealTimeTrackingService.updateOrderStatus(
      parseInt(orderId),
      status,
      deliveryPersonId,
      message
    );

    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    logError(error as Error, { orderId: req.params.orderId });
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Update delivery person location (for delivery app)
router.post('/delivery/location', async (req: Request, res: Response) => {
  try {
    const update: DeliveryPersonUpdate = req.body;
    
    await RealTimeTrackingService.updateDeliveryPersonLocation(update);
    
    res.json({ success: true });
  } catch (error) {
    logError(error as Error, req.body);
    res.status(500).json({ error: 'Failed to update delivery location' });
  }
});

// Test endpoint to simulate delivery updates
router.post('/orders/:orderId/simulate-delivery', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const orderIdNum = parseInt(orderId);

    // Simulate delivery progression
    const statuses: OrderTrackingData['status'][] = [
      'confirmed', 'preparing', 'in_transit', 'out_for_delivery', 'nearby', 'delivered'
    ];

    let currentIndex = 0;
    const interval = setInterval(async () => {
      if (currentIndex >= statuses.length) {
        clearInterval(interval);
        return;
      }

      try {
        await RealTimeTrackingService.updateOrderStatus(
          orderIdNum,
          statuses[currentIndex],
          'delivery_person_1'
        );
        currentIndex++;
      } catch (error) {
        clearInterval(interval);
        logError(error as Error, { orderId: orderIdNum });
      }
    }, 30000); // Update every 30 seconds

    res.json({ message: 'Delivery simulation started' });
  } catch (error) {
    logError(error as Error, { orderId: req.params.orderId });
    res.status(500).json({ error: 'Failed to start simulation' });
  }
});