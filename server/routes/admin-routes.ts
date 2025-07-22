import type { Express, Request, Response } from "express";
import { mongoStorage } from "../mongoStorage";
import { analyticsService } from "../analytics";
import { updateOrderDeliveryStatus } from "../delivery-status";
import { logAPIRequest } from "../logger";
import { authenticateToken, requireAdmin } from "../jwt-middleware";
import { DiscountAndDeliverySettings } from "@shared/mongoModels";

export function registerAdminRoutes(app: Express) {
  app.get(
    "/api/analytics",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      const startTime = Date.now();
      try {
        const { range = "30days" } = req.query;
        const validRanges = ["7days", "30days", "90days", "year"];

        if (!validRanges.includes(range as string)) {
          return res.status(400).json({ error: "Invalid date range" });
        }

        let analyticsData = await analyticsService.getAnalytics(range as any);

        const duration = Date.now() - startTime;
        logAPIRequest(
          "GET",
          "/api/analytics",
          200,
          duration,
          (req.user as any)?.id,
        );

        res.json(analyticsData);
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error("Analytics error:", error);
        logAPIRequest(
          "GET",
          "/api/analytics",
          500,
          duration,
          (req.user as any)?.id,
        );
        res.status(500).json({ error: "Failed to fetch analytics data" });
      }
    },
  );

  app.get(
    "/api/admin/orders",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const orders = await mongoStorage.getAllOrders();

        const enrichedOrders = await Promise.all(
          orders.map(async (order) => {
            const user = await mongoStorage.getUser(order.userId);

            const enrichedItems = await Promise.all(
              (order.items || []).map(async (item: any) => {
                const meal = await mongoStorage.getMeal(item.mealId);
                return {
                  ...item,
                  meal: meal || { name: `Meal #${item.mealId}` },
                };
              }),
            );

            let userName = "Unknown User";
            if (user) {
              userName =
                user.name ||
                user.fullName ||
                user.displayName ||
                (user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : null) ||
                user.username ||
                `Customer #${order.userId}`;
            }

            return {
              ...order,
              userName,
              items: enrichedItems,
            };
          }),
        );

        res.json(enrichedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({ message: "Error fetching orders" });
      }
    },
  );

  app.get(
    "/api/admin/subscriptions",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const subscriptions = await mongoStorage.getAllSubscriptions();

        const enrichedSubscriptions = await Promise.all(
          subscriptions.map(async (subscription) => {
            const user = await mongoStorage.getUser(subscription.userId);

            let userName = "Unknown User";
            if (user) {
              userName =
                user.name ||
                user.fullName ||
                user.displayName ||
                (user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : null) ||
                user.username ||
                `Customer #${subscription.userId}`;
            }

            return {
              ...subscription,
              userName,
            };
          }),
        );

        res.json(enrichedSubscriptions);
      } catch (err) {
        console.error("Error fetching subscriptions:", err);
        res.status(500).json({ message: "Error fetching subscriptions" });
      }
    },
  );

  app.patch(
    "/api/admin/orders/:id/status",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const orderId = parseInt(req.params.id);
        const { status } = req.body;

        const validStatuses = [
          "pending",
          "confirmed",
          "preparing",
          "in_transit",
          "out_for_delivery",
          "nearby",
          "delivered",
          "cancelled",
        ];

        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }

        const updatedOrder = await mongoStorage.updateOrderStatus(
          orderId,
          status,
        );

        if (!updatedOrder) {
          return res.status(404).json({ message: "Order not found" });
        }

        try {
          let deliveryStatus:
            | "preparing"
            | "in_transit"
            | "out_for_delivery"
            | "nearby"
            | "delivered"
            | null = null;

          switch (status) {
            case "confirmed":
              deliveryStatus = "preparing";
              break;
            case "preparing":
              deliveryStatus = "preparing";
              break;
            case "in_transit":
              deliveryStatus = "in_transit";
              break;
            case "out_for_delivery":
              deliveryStatus = "out_for_delivery";
              break;
            case "nearby":
              deliveryStatus = "nearby";
              break;
            case "delivered":
              deliveryStatus = "delivered";
              break;
          }

          if (deliveryStatus) {
            await updateOrderDeliveryStatus(
              updatedOrder.id,
              updatedOrder.userId,
              deliveryStatus,
            );
          }
        } catch (err) {
          console.error("Failed to send delivery notification:", err);
        }

        res.json(updatedOrder);
      } catch (err) {
        console.error("Error updating order status:", err);
        res.status(500).json({ message: "Error updating order status" });
      }
    },
  );

  app.get(
    "/api/admin/users",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const users = await mongoStorage.getAllUsers();
        res.json(users);
      } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ message: "Error fetching users" });
      }
    },
  );

  app.post(
    "/api/admin/users",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const userData = req.body;

        const existingUser =
          (await mongoStorage.getUserByUsername(userData.username)) ||
          (await mongoStorage.getUserByEmail(userData.email));

        if (existingUser) {
          return res.status(400).json({
            message: `User with the same ${existingUser.username === userData.username ? "username" : "email"} already exists`,
          });
        }

        const newUser = await mongoStorage.createUser(userData);
        res.status(201).json(newUser);
      } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({ message: "Error creating user" });
      }
    },
  );

  app.patch(
    "/api/admin/users/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const userData = req.body;

        const updatedUser = await mongoStorage.updateUser(userId, userData);

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json(updatedUser);
      } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({ message: "Error updating user" });
      }
    },
  );

  app.post(
    "/api/DiscountAndDeliverySettings",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const settingsData = req.body;

        const updatedSettings =
          await DiscountAndDeliverySettings.findOneAndUpdate(
            {},
            { $set: settingsData },
            {
              new: true,
              upsert: true,
              runValidators: true,
            },
          );

        res.status(200).json(updatedSettings);
      } catch (err) {
        console.error("Error updating settings:", err);

        res.status(500).json({ message: "Error updating settings" });
      }
    },
  );
  app.get("/api/DiscountAndDeliverySettings", async (req, res) => {
    try {
      const settings = await DiscountAndDeliverySettings.findOne({});
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }
      res.json(settings);
    } catch (err) {
      console.error("Error fetching settings:", err);
      res.status(500).json({ message: "Error fetching settings" });
    }
  });
}
