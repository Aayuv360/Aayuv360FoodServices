import Razorpay from "razorpay";
import crypto from "crypto";
import { storage } from "./storage";

// Define types for Razorpay requests
interface RazorpaySubscriptionRequest {
  plan_id: string;
  customer_notify: number;
  customer_id?: string;
  total_count?: number;
  start_at?: number;
  notes: Record<string, string>;
}
console.log("tets", process.env.RAZORPAY_KEY_ID);
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error(
    "Missing required environment variables: RAZORPAY_KEY_ID and/or RAZORPAY_KEY_SECRET",
  );
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const orderPaymentMap = new Map<
  number,
  {
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    status: string;
  }
>();

export const subscriptionPaymentMap = new Map<
  number,
  {
    razorpaySubscriptionId: string;
    razorpayPaymentId?: string;
    status: string;
  }
>();

export interface CreateOrderOptions {
  amount: number; // Amount in rupees
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export async function createOrder(options: CreateOrderOptions) {
  const { amount, currency = "INR", receipt, notes = {} } = options;

  const amountInPaise = amount * 100;

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
    notes,
  });

  return order;
}

export async function createPlan(options: {
  name: string;
  description: string;
  amount: number;
  interval: "weekly" | "monthly" | "yearly";
  intervalCount?: number;
}) {
  const { name, description, amount, interval, intervalCount = 1 } = options;

  const amountInPaisa = Math.round(amount * 100);

  const plan = await razorpay.plans.create({
    period: interval,
    interval: intervalCount,
    item: {
      name,
      description,
      amount: amountInPaisa,
      currency: "INR",
    },
  });

  return plan;
}

export async function createSubscription(options: {
  planId: string;
  customerId?: string;
  totalCount?: number;
  startAt?: number;
  notes?: Record<string, string>;
}) {
  const { planId, customerId, totalCount, startAt, notes = {} } = options;

  const subscriptionData: RazorpaySubscriptionRequest = {
    plan_id: planId,
    customer_notify: 1,
    notes,
  };

  if (customerId) subscriptionData.customer_id = customerId;
  if (totalCount) subscriptionData.total_count = totalCount;
  if (startAt) subscriptionData.start_at = startAt;

  const subscription = await razorpay.subscriptions.create(
    subscriptionData as any,
  );

  return subscription;
}

export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
) {
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}

export async function handlePaymentSuccess(
  entityId: number,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  signature: string,
  entityType: "order" | "subscription" = "order",
) {
  const isValid = verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    signature,
  );

  if (!isValid) {
    throw new Error("Invalid payment signature");
  }

  if (entityType === "subscription") {
    await storage.updateSubscription(entityId, {
      status: "active",
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
      paymentSignature: signature,
    });

    if (subscriptionPaymentMap.has(entityId)) {
      subscriptionPaymentMap.set(entityId, {
        razorpaySubscriptionId: razorpayOrderId,
        razorpayPaymentId,
        status: "paid",
      });
    }
  } else {
    await storage.updateOrderStatus(entityId, "confirmed");

    if (orderPaymentMap.has(entityId)) {
      orderPaymentMap.set(entityId, {
        razorpayOrderId,
        razorpayPaymentId,
        status: "paid",
      });
    }
  }

  return { success: true, entityType, entityId };
}

export async function handlePaymentFailure(orderId: number, error: any) {
  await storage.updateOrderStatus(orderId, "payment_failed");

  if (orderPaymentMap.has(orderId)) {
    const orderPayment = orderPaymentMap.get(orderId);
    orderPaymentMap.set(orderId, {
      ...orderPayment!,
      status: "failed",
    });
  }

  return { success: false, error };
}

export async function handleWebhookEvent(event: any, signature: string) {
  const isValid = verifyWebhookSignature(JSON.stringify(event), signature);

  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }

  const { event: eventName, payload } = event;

  switch (eventName) {
    case "payment.authorized":
      console.log("Payment authorized:", payload.payment.entity.id);
      break;

    case "payment.captured":
      if (
        payload.payment.entity.notes &&
        payload.payment.entity.notes.orderId
      ) {
        const orderId = parseInt(payload.payment.entity.notes.orderId);
        await storage.updateOrderStatus(orderId, "confirmed");
      }
      console.log("Payment captured:", payload.payment.entity.id);
      break;

    case "payment.failed":
      if (
        payload.payment.entity.notes &&
        payload.payment.entity.notes.orderId
      ) {
        const orderId = parseInt(payload.payment.entity.notes.orderId);
        await storage.updateOrderStatus(orderId, "payment_failed");
      }
      console.log("Payment failed:", payload.payment.entity.id);
      break;

    case "subscription.activated":
      console.log("Subscription activated:", payload.subscription.entity.id);
      break;

    case "subscription.charged":
      console.log("Subscription charged:", payload.subscription.entity.id);
      break;

    case "subscription.cancelled":
      console.log("Subscription cancelled:", payload.subscription.entity.id);
      break;

    default:
      console.log(`Unhandled event: ${eventName}`);
  }

  return { received: true };
}

function verifyWebhookSignature(payload: string, signature: string) {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(payload)
    .digest("hex");

  return expectedSignature === signature;
}

export { razorpay };
