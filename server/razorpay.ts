import Razorpay from 'razorpay';
import crypto from 'crypto';
import { storage } from './storage';

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
const orderPaymentMap = new Map<number, { 
  razorpayOrderId: string, 
  razorpayPaymentId?: string,
  status: string 
}>();

const subscriptionPaymentMap = new Map<number, {
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
  
  // Convert amount to paisa (Razorpay requires amounts in smallest currency unit)
  const amountInPaisa = Math.round(amount * 100);
  
  // Create a Razorpay order
  const order = await razorpay.orders.create({
    amount: amountInPaisa,
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
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    ...(customerId && { customer_id: customerId }),
    ...(totalCount && { total_count: totalCount }),
    ...(startAt && { start_at: startAt }),
    notes
  });
  
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
  orderId: number, 
  razorpayPaymentId: string, 
  razorpayOrderId: string, 
  signature: string
) {
  // Verify payment signature
  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature);
  
  if (!isValid) {
    throw new Error('Invalid payment signature');
  }
  
  // Update order status
  await storage.updateOrderStatus(orderId, 'confirmed');
  
  // Update in-memory map
  if (orderPaymentMap.has(orderId)) {
    orderPaymentMap.set(orderId, {
      razorpayOrderId,
      razorpayPaymentId,
      status: 'paid'
    });
  }
  
  return { success: true };
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