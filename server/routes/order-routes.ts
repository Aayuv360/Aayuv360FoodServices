import type { Express, Request, Response } from "express";
import { mongoStorage } from "../mongoStorage";
import { smsService } from "../sms-service";
import { getNextSequence } from "../../shared/mongoModels";
import { authenticateToken } from "../jwt-middleware";

export function registerOrderRoutes(app: Express) {
  app.post("/api/orders/generate-id", authenticateToken, async (req, res) => {
    try {
      const orderId = await getNextSequence("order");
      res.json({ orderId });
    } catch (error) {
      console.error("Error generating order ID:", error);
      res.status(500).json({ message: "Failed to generate order ID" });
    }
  });

  app.post("/api/orders", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const cartItems = await mongoStorage.getCartItems(userId);

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "Your cart is empty" });
      }

      const orderItems = [];
      let totalOrderPrice = 0;

      for (const item of cartItems) {
        const meal = await mongoStorage.getMeal(item.mealId);
        if (!meal) continue;

        const basePrice = item.quantity * meal.price;
        const optionPrice = item.curryOptionPrice
          ? item.quantity * item.curryOptionPrice
          : 0;
        const itemTotalPrice = basePrice + optionPrice;

        totalOrderPrice += itemTotalPrice;

        orderItems.push({
          mealId: item.mealId,
          quantity: item.quantity,
          price: itemTotalPrice,
          notes: item.notes || "",
          curryOptionId: item.curryOptionId || null,
          curryOptionName: item.curryOptionName || null,
          curryOptionPrice: item.curryOptionPrice || 0,
        });
      }

      const deliveryCharge = req.body.deliveryCharge || 0;

      const status = req.body.status || "pending";
      const orderData: any = {
        userId,
        status,
        deliveryAddressId: req.body.deliveryAddressId,
        totalPrice: totalOrderPrice + deliveryCharge,
        deliveryCharge,
        items: orderItems,
        createdAt: new Date(),
      };

      if (
        req.body.razorpayPaymentId &&
        req.body.razorpayOrderId &&
        req.body.razorpaySignature
      ) {
        const { verifyPaymentSignature } = await import("../razorpay");

        const isValid = verifyPaymentSignature(
          req.body.razorpayOrderId,
          req.body.razorpayPaymentId,
          req.body.razorpaySignature,
        );

        if (!isValid) {
          return res.status(400).json({ message: "Invalid payment signature" });
        }

        orderData.razorpayPaymentId = req.body.razorpayPaymentId;
        orderData.razorpayOrderId = req.body.razorpayOrderId;
        orderData.razorpaySignature = req.body.razorpaySignature;
        orderData.status = "confirmed";
      }

      const order = await mongoStorage.createOrder(orderData);

      if (order.status === "confirmed") {
        try {
          const user = await mongoStorage.getUser(userId);
          if (user) {
            let deliveryPhone = null;

            if (req.body.deliveryAddressId) {
              const deliveryAddress = await mongoStorage.getAddressById(
                req.body.deliveryAddressId,
              );
              deliveryPhone = deliveryAddress?.phone;
            }

            if (!deliveryPhone && user.phone) {
              deliveryPhone = user.phone;
            }

            if (deliveryPhone) {
              const userName = user.name || user.username || "Customer";
              await smsService.sendOrderDeliveryNotification(
                deliveryPhone,
                userName,
                order.id,
                orderItems,
                "Soon",
              );
            }
          }
        } catch (smsError) {
          console.error("Error sending order confirmation SMS:", smsError);
        }
      }

      res.status(201).json(order);
    } catch (err) {
      console.error("Error creating order:", err);
      res.status(500).json({ message: "Error creating order" });
    }
  });

  app.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const orders = await mongoStorage.getOrdersByUserId(userId);
      res.json(orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  app.get("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const orderId = parseInt(req.params.id);

      const order = await mongoStorage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.userId !== userId) {
        return res
          .status(403)
          .json({ message: "You do not have permission to access this order" });
      }

      const orderItems = await mongoStorage.getOrderItems(orderId);

      const enrichedOrderItems = await Promise.all(
        orderItems.map(async (item) => {
          const meal = await mongoStorage.getMeal(item.mealId);
          return {
            ...item,
            meal,
          };
        }),
      );

      res.json({
        ...order,
        items: enrichedOrderItems,
      });
    } catch (err) {
      console.error("Error fetching order:", err);
      res.status(500).json({ message: "Error fetching order" });
    }
  });

  // PATCH endpoint to update order with full payload after payment
  app.patch("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const orderId = parseInt(req.params.id);

      // Get cart items for this user
      const cartItems = await mongoStorage.getCartItems(userId);

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "Your cart is empty" });
      }

      const orderItems = [];
      let totalOrderPrice = 0;

      for (const item of cartItems) {
        const meal = await mongoStorage.getMeal(item.mealId);
        if (!meal) continue;

        const basePrice = item.quantity * meal.price;
        const optionPrice = item.curryOptionPrice
          ? item.quantity * item.curryOptionPrice
          : 0;
        const itemTotalPrice = basePrice + optionPrice;

        totalOrderPrice += itemTotalPrice;

        orderItems.push({
          mealId: item.mealId,
          quantity: item.quantity,
          price: itemTotalPrice,
          notes: item.notes || "",
          curryOptionId: item.curryOptionId || null,
          curryOptionName: item.curryOptionName || null,
          curryOptionPrice: item.curryOptionPrice || 0,
        });
      }

      const deliveryCharge = req.body.deliveryCharge || 40;

      // Verify payment signature if provided
      if (
        req.body.razorpayPaymentId &&
        req.body.razorpayOrderId &&
        req.body.razorpaySignature
      ) {
        const { verifyPaymentSignature } = await import("../razorpay");

        const isValid = verifyPaymentSignature(
          req.body.razorpayOrderId,
          req.body.razorpayPaymentId,
          req.body.razorpaySignature,
        );

        if (!isValid) {
          return res.status(400).json({ message: "Invalid payment signature" });
        }
      }

      const orderData: any = {
        id: orderId,
        userId,
        status: req.body.status || "confirmed",
        deliveryAddress: req.body.deliveryAddress,
        totalPrice: totalOrderPrice + deliveryCharge,
        deliveryCharge,
        items: orderItems,
        createdAt: new Date(),
        razorpayPaymentId: req.body.razorpayPaymentId,
        razorpayOrderId: req.body.razorpayOrderId,
        razorpaySignature: req.body.razorpaySignature,
      };

      const order = await mongoStorage.createOrder(orderData);

      // Send SMS notifications for confirmed orders
      if (order.status === "confirmed") {
        try {
          const user = await mongoStorage.getUser(userId);
          if (user) {
            let deliveryPhone = null;

            if (req.body.deliveryDetails?.phoneNumber) {
              deliveryPhone = req.body.deliveryDetails.phoneNumber;
            } else if (user.phone) {
              deliveryPhone = user.phone;
            }

            if (deliveryPhone) {
              const userName = user.name || user.username || "Customer";
              await smsService.sendOrderDeliveryNotification(
                deliveryPhone,
                userName,
                order.id,
                orderItems,
                "Soon",
              );
            }
          }
        } catch (smsError) {
          console.error("Error sending order confirmation SMS:", smsError);
        }
      }

      res.json(order);
    } catch (err) {
      console.error("Error updating order:", err);
      res.status(500).json({ message: "Error updating order" });
    }
  });
}
