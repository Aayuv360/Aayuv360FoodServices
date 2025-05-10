import Razorpay from 'razorpay';
import crypto from 'crypto';
import { storage } from './storage';

// Define types for Razorpay requests
interface RazorpaySubscriptionRequest {
  plan_id: string;
  customer_notify: number;
  customer_id?: string;
  total_count?: number;
  start_at?: number;
  notes: Record<string, string>;
}

// Check for required environment variables
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Missing required environment variables: RAZORPAY_KEY_ID and/or RAZORPAY_KEY_SECRET');
}

// Initialize Razorpay with API keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Store payment information in memory since we can't modify the database schema
export const orderPaymentMap = new Map<number, { 
  razorpayOrderId: string, 
  razorpayPaymentId?: string,
  status: string 
}>();

export const subscriptionPaymentMap = new Map<number, {
  razorpaySubscriptionId: string,
  razorpayPaymentId?: string,
  status: string
}>();

export interface CreateOrderOptions {
  amount: number; // Amount in rupees
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

/**
 * Creates a Razorpay order
 * @param options - Order creation options
 * @returns Razorpay order object
 */
export async function createOrder(options: CreateOrderOptions) {
  const { amount, currency = 'INR', receipt, notes = {} } = options;
  
  // Our app already stores amounts in paise (smallest currency unit)
  // We don't need to convert again
  
  // Create a Razorpay order
  const order = await razorpay.orders.create({
    amount: amount,
    currency,
    receipt,
    notes
  });
  
  return order;
}

/**
 * Creates a subscription plan in Razorpay
 * @param options Plan creation options
 * @returns Razorpay plan object
 */
export async function createPlan(options: {
  name: string;
  description: string;
  amount: number;
  interval: 'weekly' | 'monthly' | 'yearly';
  intervalCount?: number;
}) {
  const { name, description, amount, interval, intervalCount = 1 } = options;
  
  // Convert amount to paisa
  const amountInPaisa = Math.round(amount * 100);
  
  // Create a plan in Razorpay
  const plan = await razorpay.plans.create({
    period: interval,
    interval: intervalCount,
    item: {
      name,
      description,
      amount: amountInPaisa,
      currency: 'INR'
    }
  });
  
  return plan;
}

/**
 * Creates a subscription in Razorpay
 * @param options Subscription creation options
 * @returns Razorpay subscription object
 */
export async function createSubscription(options: {
  planId: string;
  customerId?: string;
  totalCount?: number;
  startAt?: number;
  notes?: Record<string, string>;
}) {
  const { planId, customerId, totalCount, startAt, notes = {} } = options;
  
  // Create a subscription in Razorpay
  const subscriptionData: RazorpaySubscriptionRequest = {
    plan_id: planId,
    customer_notify: 1,
    notes
  };
  
  // Only add optional fields if they are defined
  if (customerId) subscriptionData.customer_id = customerId;
  if (totalCount) subscriptionData.total_count = totalCount;
  if (startAt) subscriptionData.start_at = startAt;
  
  // Cast to any to bypass Razorpay type checking issues
  const subscription = await razorpay.subscriptions.create(subscriptionData as any);
  
  return subscription;
}

/**
 * Verify Razorpay payment signature
 * @param razorpayOrderId Razorpay order ID
 * @param razorpayPaymentId Razorpay payment ID
 * @param signature The signature received from Razorpay
 * @returns True if signature is valid, false otherwise
 */
export function verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string) {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  
  return generatedSignature === signature;
}

/**
 * Handle payment success and update order status
 * @param orderId App order ID
 * @param razorpayPaymentId Razorpay payment ID
 * @param razorpayOrderId Razorpay order ID
 * @param signature Razorpay signature
 */
export async function handlePaymentSuccess(
  entityId: number, 
  razorpayPaymentId: string, 
  razorpayOrderId: string, 
  signature: string,
  entityType: 'order' | 'subscription' = 'order'
) {
  // Verify payment signature
  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature);
  
  if (!isValid) {
    throw new Error('Invalid payment signature');
  }
  
  if (entityType === 'subscription') {
    // Update subscription status to active
    await storage.updateSubscription(entityId, {
      status: 'active',
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
      paymentSignature: signature
    });
    
    // Update in-memory map
    if (subscriptionPaymentMap.has(entityId)) {
      subscriptionPaymentMap.set(entityId, {
        razorpaySubscriptionId: razorpayOrderId,
        razorpayPaymentId,
        status: 'paid'
      });
    }
  } else {
    // Update order status
    await storage.updateOrderStatus(entityId, 'confirmed');
    
    // Update in-memory map
    if (orderPaymentMap.has(entityId)) {
      orderPaymentMap.set(entityId, {
        razorpayOrderId,
        razorpayPaymentId,
        status: 'paid'
      });
    }
  }
  
  return { success: true, entityType, entityId };
}

/**
 * Handle payment failure
 * @param orderId App order ID
 * @param error Error details
 */
export async function handlePaymentFailure(orderId: number, error: any) {
  // Update order status
  await storage.updateOrderStatus(orderId, 'payment_failed');
  
  // Update in-memory map
  if (orderPaymentMap.has(orderId)) {
    const orderPayment = orderPaymentMap.get(orderId);
    orderPaymentMap.set(orderId, {
      ...orderPayment!,
      status: 'failed'
    });
  }
  
  return { success: false, error };
}

/**
 * Process webhook events from Razorpay
 * @param event Webhook event from Razorpay
 * @param signature Razorpay signature
 */
export async function handleWebhookEvent(event: any, signature: string) {
  // Verify webhook signature
  const isValid = verifyWebhookSignature(JSON.stringify(event), signature);
  
  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }
  
  const { event: eventName, payload } = event;
  
  switch (eventName) {
    case 'payment.authorized':
      // Payment is authorized but not yet captured
      console.log('Payment authorized:', payload.payment.entity.id);
      break;
      
    case 'payment.captured':
      // Payment is captured - update order status if orderId is in notes
      if (payload.payment.entity.notes && payload.payment.entity.notes.orderId) {
        const orderId = parseInt(payload.payment.entity.notes.orderId);
        await storage.updateOrderStatus(orderId, 'confirmed');
      }
      console.log('Payment captured:', payload.payment.entity.id);
      break;
      
    case 'payment.failed':
      // Payment failed - update order status if orderId is in notes
      if (payload.payment.entity.notes && payload.payment.entity.notes.orderId) {
        const orderId = parseInt(payload.payment.entity.notes.orderId);
        await storage.updateOrderStatus(orderId, 'payment_failed');
      }
      console.log('Payment failed:', payload.payment.entity.id);
      break;
      
    case 'subscription.activated':
      // Subscription is activated
      console.log('Subscription activated:', payload.subscription.entity.id);
      break;
      
    case 'subscription.charged':
      // Subscription payment charged
      console.log('Subscription charged:', payload.subscription.entity.id);
      break;
      
    case 'subscription.cancelled':
      // Subscription is cancelled
      console.log('Subscription cancelled:', payload.subscription.entity.id);
      break;
      
    default:
      console.log(`Unhandled event: ${eventName}`);
  }
  
  return { received: true };
}

/**
 * Verify webhook signature
 * @param payload Webhook payload as string
 * @param signature Razorpay signature from headers
 * @returns True if signature is valid, false otherwise
 */
function verifyWebhookSignature(payload: string, signature: string) {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(payload)
    .digest('hex');
  
  return expectedSignature === signature;
}

export { razorpay };