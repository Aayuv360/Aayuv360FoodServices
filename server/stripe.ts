import Stripe from 'stripe';
import { storage } from "./storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
}

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export interface CreatePaymentIntentOptions {
  amount: number; // Amount in rupees
  metadata?: Record<string, string>;
  customerId?: string;
  description?: string;
}

export async function createPaymentIntent(options: CreatePaymentIntentOptions) {
  const { amount, metadata = {}, customerId, description } = options;
  
  // Convert amount to paise (Stripe requires amounts in smallest currency unit)
  const amountInPaise = Math.round(amount * 100);
  
  // Create a PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInPaise,
    currency: 'inr',
    description,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
    ...(customerId ? { customer: customerId } : {}),
  });
  
  return paymentIntent;
}

export interface CreateSubscriptionOptions {
  customerId: string;
  priceId: string;
  userId: number;
  metadata?: Record<string, string>;
}

export async function createSubscription(options: CreateSubscriptionOptions) {
  const { customerId, priceId, userId, metadata = {} } = options;
  
  // Create the subscription
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { 
      save_default_payment_method: 'on_subscription' 
    },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      userId: userId.toString(),
      ...metadata
    },
  });
  
  return subscription;
}

// Store Stripe customer IDs in memory for now since we can't modify the database schema
const stripeCustomerMap = new Map<number, string>();

export async function getOrCreateCustomer(userId: number, email: string, name: string) {
  // First, check if the user already has a Stripe customer ID in our map
  if (stripeCustomerMap.has(userId)) {
    return stripeCustomerMap.get(userId)!;
  }
  
  // Create a new customer in Stripe
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId: userId.toString()
    }
  });
  
  // Store the customer ID in our map
  stripeCustomerMap.set(userId, customer.id);
  
  return customer.id;
}

// Temporary in-memory storage for payment intent IDs
export const orderPaymentMap = new Map<number, { 
  paymentIntentId: string, 
  status: string 
}>();

export const subscriptionPaymentMap = new Map<number, {
  subscriptionId: string,
  priceId: string,
  paymentIntentId: string,
  status: string
}>();

// Function to handle webhook events from Stripe
export async function handleWebhookEvent(event: Stripe.Event) {
  const { type, data } = event;
  
  switch (type) {
    case 'payment_intent.succeeded':
      const paymentIntent = data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
      
      // If this payment was for an order, update the order status
      if (paymentIntent.metadata.orderId) {
        const orderId = parseInt(paymentIntent.metadata.orderId);
        await storage.updateOrderStatus(orderId, 'confirmed');
        
        // Update our in-memory map
        if (orderPaymentMap.has(orderId)) {
          orderPaymentMap.set(orderId, { 
            paymentIntentId: paymentIntent.id, 
            status: 'succeeded' 
          });
        }
      }
      
      break;
      
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent failed: ${failedPaymentIntent.id}`);
      
      // Handle failed payment
      if (failedPaymentIntent.metadata.orderId) {
        const orderId = parseInt(failedPaymentIntent.metadata.orderId);
        await storage.updateOrderStatus(orderId, 'payment_failed');
        
        // Update our in-memory map
        if (orderPaymentMap.has(orderId)) {
          orderPaymentMap.set(orderId, { 
            paymentIntentId: failedPaymentIntent.id, 
            status: 'failed' 
          });
        }
      }
      
      break;
      
    case 'invoice.payment_succeeded':
      const invoice = data.object as Stripe.Invoice;
      console.log(`Invoice paid: ${invoice.id}`);
      
      // If this was for a subscription, update the subscription status
      if (invoice.subscription) {
        console.log(`Subscription ${invoice.subscription} is active`);
      }
      
      break;
      
    case 'customer.subscription.created':
      const subscription = data.object as Stripe.Subscription;
      console.log(`Subscription created: ${subscription.id}`);
      
      // If subscription has userId in metadata, update the user's subscription
      if (subscription.metadata.userId) {
        const userId = parseInt(subscription.metadata.userId);
        console.log(`Subscription created for user ${userId}`);
      }
      
      break;
      
    case 'customer.subscription.updated':
      const updatedSubscription = data.object as Stripe.Subscription;
      console.log(`Subscription updated: ${updatedSubscription.id}`);
      
      // Handle subscription status changes
      if (updatedSubscription.metadata.userId) {
        const userId = parseInt(updatedSubscription.metadata.userId);
        console.log(`Subscription updated for user ${userId}`);
      }
      
      break;
      
    default:
      console.log(`Unhandled event type: ${type}`);
  }
  
  return { received: true };
}

export { stripe };