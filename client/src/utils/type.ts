import { z } from "zod";
import { subscriptionCrudSchema } from "./schema";

export interface RazorpayPaymentData {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export type SubscriptionFormValues = z.infer<typeof subscriptionCrudSchema>;

export type FormStep = "plan" | "payment";
