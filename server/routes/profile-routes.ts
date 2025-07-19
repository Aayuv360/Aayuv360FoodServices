import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { logAPIRequest, logError } from "../logger";
import { createOrder } from "../razorpay";
import { authenticateToken } from "../jwt-middleware";

export function registerProfileRoutes(app: Express) {
  // Update user profile
  app.put("/api/profile", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { name, email, phone } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          message: "Name and email are required",
        });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          message: "Email is already in use",
        });
      }

      const updatedUser = await storage.updateUser(userId, {
        name,
        email,
        phone: phone || null,
        updatedAt: new Date(),
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
        },
      });
    } catch (error) {
      logError(error as Error, { endpoint: "PUT /api/profile" });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/profile/wallet", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        balance: user.walletBalance || 0,
        currency: "INR",
      });
    } catch (error) {
      logError(error as Error, { endpoint: "GET /api/profile/wallet" });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(
    "/api/profile/wallet/create-order",
    authenticateToken,
    async (req, res) => {
      try {
        const userId = req.user!.id;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
          return res.status(400).json({
            message: "Invalid amount",
          });
        }

        if (amount > 50000) {
          return res.status(400).json({
            message: "Maximum wallet add limit is ₹50,000",
          });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Create Razorpay order
        const razorpayOrder = await createOrder({
          amount,
          receipt: `wallet_topup_${userId}_${Date.now()}`,
          notes: {
            userId: userId.toString(),
            type: "wallet_topup",
            amount: amount.toString(),
          },
        });

        res.json({
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        });
      } catch (error) {
        logError(error as Error, {
          endpoint: "POST /api/profile/wallet/create-order",
        });
        res.status(500).json({ message: "Failed to create payment order" });
      }
    },
  );

  app.post("/api/profile/wallet/add", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { amount, paymentMethod = "razorpay", paymentDetails } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          message: "Invalid amount. Amount must be greater than 0",
        });
      }

      if (amount > 50000) {
        return res.status(400).json({
          message: "Maximum wallet add limit is ₹50,000",
        });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = user.walletBalance || 0;
      const newBalance = currentBalance + amount;

      const updatedUser = await storage.updateUser(userId, {
        walletBalance: newBalance,
        updatedAt: new Date(),
      });

      await storage.createWalletTransaction({
        userId,
        type: "credit",
        amount,
        previousBalance: currentBalance,
        newBalance,
        description: `Wallet recharge via ${paymentMethod}`,
        paymentMethod,
        status: "completed",
        transactionId:
          paymentDetails?.payment_id ||
          `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        razorpayPaymentId: paymentDetails?.payment_id,
        razorpayOrderId: paymentDetails?.order_id,
        createdAt: new Date(),
      });

      res.json({
        message: "Money added to wallet successfully",
        balance: newBalance,
        transaction: {
          amount,
          type: "credit",
          newBalance,
        },
      });
    } catch (error) {
      logError(error as Error, { endpoint: "POST /api/profile/wallet/add" });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/profile/wallet/update", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { balance, reason = "Manual adjustment" } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (balance < 0) {
        return res.status(400).json({
          message: "Wallet balance cannot be negative",
        });
      }

      const previousBalance = user.walletBalance || 0;

      const updatedUser = await storage.updateUser(userId, {
        walletBalance: balance,
        updatedAt: new Date(),
      });

      // Log wallet transaction
      await storage.createWalletTransaction({
        userId,
        type: balance > previousBalance ? "credit" : "debit",
        amount: Math.abs(balance - previousBalance),
        previousBalance,
        newBalance: balance,
        description: reason,
        paymentMethod: "manual",
        status: "completed",
        transactionId: `wallet_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      });

      res.json({
        message: "Wallet balance updated successfully",
        balance,
        previousBalance,
      });
    } catch (error) {
      logError(error as Error, { endpoint: "PUT /api/profile/wallet/update" });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(
    "/api/profile/wallet/transactions",
    authenticateToken,
    async (req, res) => {
      try {
        const userId = req.user!.id;
        const { page = 1, limit = 20 } = req.query;

        const transactions = await storage.getWalletTransactions(
          userId,
          parseInt(page as string),
          parseInt(limit as string),
        );

        res.json({
          transactions,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
          },
        });
      } catch (error) {
        logError(error as Error, {
          endpoint: "GET /api/profile/wallet/transactions",
        });
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/profile/delete-account",
    authenticateToken,
    async (req, res) => {
      try {
        const userId = req.user!.id;
        const { reason = "User requested deletion" } = req.body;

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const activeSubscriptions = await storage.getUserSubscriptions(userId);
        const hasActiveSubscriptions = activeSubscriptions.some(
          (sub: any) => sub.status === "active",
        );

        if (hasActiveSubscriptions) {
          return res.status(400).json({
            message:
              "Cannot delete account with active subscriptions. Please cancel your subscriptions first.",
            hasActiveSubscriptions: true,
          });
        }

        const existingDeletionRequest =
          await storage.getDeletionRequest(userId);
        if (!existingDeletionRequest) {
          await storage.createDeletionRequest({
            userId,
            reason,
            requestedAt: new Date(),
            status: "completed",
            userEmail: user.email,
            userName: user.name || user.username || user.email,
            processedAt: new Date(),
          });
        }

        await storage.clearCart(userId);

        const userOrders = await storage.getUserOrders(userId);
        for (const order of userOrders) {
          await storage.updateOrder(order.id, {
            userId: null,
            customerDeleted: true,
            updatedAt: new Date(),
          });
        }

        const userSubscriptions = await storage.getUserSubscriptions(userId);
        for (const subscription of userSubscriptions) {
          await storage.updateSubscription(subscription.id, {
            userId: null,
            status: "cancelled",
            customerDeleted: true,
            updatedAt: new Date(),
          });
        }

        const userAddresses = await storage.getUserAddresses(userId);
        for (const address of userAddresses) {
          await storage.deleteAddress(address.id);
        }

        await storage.deleteUser(userId);

        req.logout((err) => {
          if (err) {
            console.error("Error during logout:", err);
          }
        });

        return res.json({
          message:
            "Account deleted successfully. All your data has been removed.",
          deleted: true,
        });
      } catch (error) {
        logError(error as Error, {
          endpoint: "POST /api/profile/delete-account",
        });
        return res.status(500).json({ message: "Internal server error" });
      }
    },
  );
}
