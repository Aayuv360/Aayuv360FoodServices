
import type { Express, Request, Response } from "express";
import { mongoStorage } from "../mongoStorage";
import { smsService } from "../sms-service";

export function registerOrderRoutes(app: Express) {
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
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

      const order = await mongoStorage.createOrder({
        userId,
        status: "pending",
        deliveryAddress: req.body.deliveryAddress,
        totalPrice: totalOrderPrice + deliveryCharge,
        deliveryCharge,
        items: orderItems,
        createdAt: new Date(),
      });

      try {
        const user = await mongoStorage.getUser(userId);
        if (user) {
          let deliveryPhone = null;

          if (req.body.deliveryAddress?.phone) {
            deliveryPhone = req.body.deliveryAddress.phone;
          } else if (req.body.deliveryAddressId) {
            const deliveryAddress = await mongoStorage.getAddressById(
              req.body.deliveryAddressId
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
              "Soon"
            );
          }
        }
      } catch (smsError) {
        console.error("Error sending order confirmation SMS:", smsError);
      }

      res.status(201).json(order);
    } catch (err) {
      console.error("Error creating order:", err);
      res.status(500).json({ message: "Error creating order" });
    }
  });

  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const orders = await mongoStorage.getOrdersByUserId(userId);
      res.json(orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
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
        })
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
}
