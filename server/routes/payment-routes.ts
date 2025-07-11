import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import {
  createOrder,
  handlePaymentSuccess,
  handlePaymentFailure,
  handleWebhookEvent,
  verifyPaymentSignature,
  orderPaymentMap,
  subscriptionPaymentMap,
} from "../razorpay";

export function registerPaymentRoutes(app: Express) {
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  app.post("/api/payments/create-order", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { amount, orderId, type = "order", notes = {} } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      if (!orderId) {
        return res.status(400).json({ message: "ID is required" });
      }

      let entityType = "order";
      let entity;
      if (type === "subscription") {
        entityType = "subscription";
      } else if (type === "subscriptionUpgrade") {
        const subscription = await storage.getSubscription(orderId);

        if (!subscription) {
          return res.status(404).json({ message: "Subscription not found" });
        }

        if (subscription.userId !== userId) {
          return res.status(403).json({
            message: "You do not have permission to pay for this subscription",
          });
        }

        entity = subscription;
        entityType = "subscriptionUpgrade";
      } else if (type === "subscriptionRenewal") {
        const subscription = await storage.getSubscription(orderId);

        if (!subscription) {
          return res.status(404).json({ message: "Subscription not found" });
        }

        if (subscription.userId !== userId) {
          return res.status(403).json({
            message: "You do not have permission to pay for this subscription",
          });
        }

        entity = subscription;
        entityType = "subscriptionRenewal";
      } else {
        entity = orderId;
      }

      const razorpayOrder = await createOrder({
        amount,
        receipt: `${entityType}_${orderId}`,
        notes: {
          entityType,
          entityId: orderId.toString(),
          userId: userId.toString(),
          ...notes,
        },
      });

      if (entityType === "subscription") {
        subscriptionPaymentMap.set(orderId, {
          razorpaySubscriptionId: razorpayOrder.id,
          status: "created",
        });
      } else if (entityType === "subscriptionUpgrade") {
        subscriptionPaymentMap.set(orderId, {
          razorpaySubscriptionId: razorpayOrder.id,
          status: "upgrade",
        });
      } else if (entityType === "subscriptionRenewal") {
        subscriptionPaymentMap.set(orderId, {
          razorpaySubscriptionId: razorpayOrder.id,
          status: "renewal",
        });
      } else {
        orderPaymentMap.set(orderId, {
          razorpayOrderId: razorpayOrder.id,
          status: "created",
        });
      }

      res.json({
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err) {
      console.error("Error creating Razorpay order:", err);
      res.status(500).json({ message: "Error creating payment order" });
    }
  });

  app.post("/api/payments/verify", isAuthenticated, async (req, res) => {
    try {
      const {
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        type = "order",
      } = req.body;

      if (
        !orderId ||
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature
      ) {
        return res
          .status(400)
          .json({ message: "Missing required payment verification details" });
      }

      const result = await handlePaymentSuccess(
        parseInt(orderId),
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        type as "order" | "subscription",
      );

      res.json(result);
    } catch (err: any) {
      console.error("Error verifying payment:", err);
      res
        .status(400)
        .json({ message: err.message || "Payment verification failed" });
    }
  });

  app.post("/api/payments/failed", isAuthenticated, async (req, res) => {
    try {
      const { orderId, error } = req.body;

      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }

      const result = await handlePaymentFailure(parseInt(orderId), error);
      res.json(result);
    } catch (err) {
      console.error("Error handling failed payment:", err);
      res.status(500).json({ message: "Error handling failed payment" });
    }
  });

  app.post("/api/webhook/razorpay", async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;

      if (!signature) {
        return res.status(400).json({ message: "Missing Razorpay signature" });
      }

      const result = await handleWebhookEvent(req.body, signature);
      res.json(result);
    } catch (err: any) {
      console.error("Error processing Razorpay webhook:", err);
      res
        .status(400)
        .json({ message: err.message || "Webhook processing failed" });
    }
  });

  app.patch("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const orderId = parseInt(req.params.id);
      const { status, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
        req.body;

      const { mongoStorage } = await import("../mongoStorage");
      const order = await mongoStorage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.userId !== userId && (req.user as any).role !== "admin") {
        return res
          .status(403)
          .json({ message: "You do not have permission to update this order" });
      }

      const allowedTransitions: Record<string, string[]> = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["delivered", "cancelled"],
        delivered: [],
        cancelled: [],
      };

      if (status && order.status !== status) {
        if (!allowedTransitions[order.status].includes(status)) {
          return res.status(400).json({
            message: `Cannot transition order from ${order.status} to ${status}`,
          });
        }
      }

      if (
        status === "confirmed" &&
        razorpayPaymentId &&
        razorpayOrderId &&
        razorpaySignature
      ) {
        const isValid = verifyPaymentSignature(
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        );

        if (!isValid) {
          return res.status(400).json({ message: "Invalid payment signature" });
        }

        orderPaymentMap.set(orderId, {
          razorpayOrderId,
          razorpayPaymentId,
          status: "paid",
        });
      }

      await mongoStorage.updateOrderStatus(orderId, status);
      const updatedOrder = await mongoStorage.getOrder(orderId);

      res.json(updatedOrder);
    } catch (err) {
      console.error("Error updating order:", err);
      res.status(500).json({ message: "Error updating order" });
    }
  });

  // Add endpoint to get Razorpay public key
  app.get("/api/payments/config", (req, res) => {
    try {
      const razorpayKeyId = process.env.RAZORPAY_KEY_ID;

      if (!razorpayKeyId) {
        return res.status(500).json({
          message: "Payment gateway not configured",
        });
      }

      res.json({
        key: razorpayKeyId,
        currency: "INR",
      });
    } catch (error) {
      console.error("Error getting payment config:", error);
      res.status(500).json({
        message: "Error getting payment configuration",
      });
    }
  });
}
