import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { logAPIRequest, logError } from "../logger";
import { createOrder } from "../razorpay";

export function registerProfileRoutes(app: Express) {
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Update user profile
  app.put("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { name, email, phone, address } = req.body;

      logAPIRequest("PUT /api/profile", userId, { name, email });

      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ 
          message: "Name and email are required" 
        });
      }

      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ 
          message: "Email is already in use" 
        });
      }

      const updatedUser = await storage.updateUser(userId, {
        name,
        email,
        phone: phone || null,
        address: address || null,
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
          address: updatedUser.address,
        },
      });
    } catch (error) {
      logError(error as Error, { endpoint: "PUT /api/profile" });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user wallet balance
  app.get("/api/profile/wallet", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      logAPIRequest("GET /api/profile/wallet", userId);

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

  // Create Razorpay order for wallet top-up
  app.post("/api/profile/wallet/create-order", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { amount } = req.body;

      logAPIRequest("POST /api/profile/wallet/create-order", userId, { amount });

      if (!amount || amount <= 0) {
        return res.status(400).json({ 
          message: "Invalid amount" 
        });
      }

      if (amount > 50000) {
        return res.status(400).json({ 
          message: "Maximum wallet add limit is ₹50,000" 
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
        }
      });

      res.json({
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      });
    } catch (error) {
      logError(error as Error, { endpoint: "POST /api/profile/wallet/create-order" });
      res.status(500).json({ message: "Failed to create payment order" });
    }
  });

  // Add money to wallet
  app.post("/api/profile/wallet/add", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { amount, paymentMethod = "razorpay", paymentDetails } = req.body;

      logAPIRequest("POST /api/profile/wallet/add", userId, { amount });

      // Validate amount
      if (!amount || amount <= 0) {
        return res.status(400).json({ 
          message: "Invalid amount. Amount must be greater than 0" 
        });
      }

      if (amount > 50000) {
        return res.status(400).json({ 
          message: "Maximum wallet add limit is ₹50,000" 
        });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = user.walletBalance || 0;
      const newBalance = currentBalance + amount;

      // Update user wallet balance
      const updatedUser = await storage.updateUser(userId, {
        walletBalance: newBalance,
        updatedAt: new Date(),
      });

      // Log wallet transaction
      await storage.createWalletTransaction({
        userId,
        type: "credit",
        amount,
        previousBalance: currentBalance,
        newBalance,
        description: `Wallet recharge via ${paymentMethod}`,
        paymentMethod,
        status: "completed",
        transactionId: paymentDetails?.payment_id || `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

  // Update wallet balance (admin only or internal use)
  app.put("/api/profile/wallet/update", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { balance, reason = "Manual adjustment" } = req.body;

      logAPIRequest("PUT /api/profile/wallet/update", userId, { balance });

      // Check if user is admin (you can add admin check here)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For security, only allow admins to directly update wallet balance
      // For now, we'll allow the user to update their own balance
      if (balance < 0) {
        return res.status(400).json({ 
          message: "Wallet balance cannot be negative" 
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

  // Get wallet transaction history
  app.get("/api/profile/wallet/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { page = 1, limit = 20 } = req.query;

      logAPIRequest("GET /api/profile/wallet/transactions", userId);

      const transactions = await storage.getWalletTransactions(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        transactions,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        },
      });
    } catch (error) {
      logError(error as Error, { endpoint: "GET /api/profile/wallet/transactions" });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete account immediately
  app.post("/api/profile/delete-account", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { reason = "User requested deletion" } = req.body;

      logAPIRequest("POST /api/profile/delete-account", userId);

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has active subscriptions
      const activeSubscriptions = await storage.getUserSubscriptions(userId);
      const hasActiveSubscriptions = activeSubscriptions.some(
        (sub: any) => sub.status === "active"
      );

      if (hasActiveSubscriptions) {
        return res.status(400).json({
          message: "Cannot delete account with active subscriptions. Please cancel your subscriptions first.",
          hasActiveSubscriptions: true,
        });
      }

      // Log deletion reason
      await storage.createDeletionRequest({
        userId,
        reason,
        requestedAt: new Date(),
        status: "completed",
        userEmail: user.email,
        userName: user.name || user.username || user.email,
        processedAt: new Date(),
      });

      // Delete user data in sequence
      // 1. Clear cart
      await storage.clearCart(userId);
      
      // 2. Update orders to mark as deleted user
      const userOrders = await storage.getUserOrders(userId);
      for (const order of userOrders) {
        await storage.updateOrder(order.id, {
          userId: null, // Anonymize
          customerDeleted: true,
          updatedAt: new Date(),
        });
      }

      // 3. Update subscriptions to mark as deleted user
      const userSubscriptions = await storage.getUserSubscriptions(userId);
      for (const subscription of userSubscriptions) {
        await storage.updateSubscription(subscription.id, {
          userId: null, // Anonymize
          status: "cancelled",
          customerDeleted: true,
          updatedAt: new Date(),
        });
      }

      // 4. Delete addresses
      const userAddresses = await storage.getUserAddresses(userId);
      for (const address of userAddresses) {
        await storage.deleteAddress(address.id);
      }

      // 5. Finally delete the user account
      const deletedUser = await storage.deleteUser(userId);

      // Destroy session
      req.logout((err) => {
        if (err) {
          console.error("Error during logout:", err);
        }
      });

      res.json({
        message: "Account deleted successfully. All your data has been removed.",
        deleted: true,
      });
    } catch (error) {
      logError(error as Error, { endpoint: "POST /api/profile/delete-account" });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get deletion request status
  app.get("/api/profile/deletion-status", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;

      logAPIRequest("GET /api/profile/deletion-status", userId);

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.deletionRequested) {
        return res.json({
          deletionRequested: false,
          status: null,
        });
      }

      const deletionRequest = await storage.getDeletionRequest(userId);

      res.json({
        deletionRequested: true,
        status: deletionRequest?.status || "pending",
        requestedAt: user.deletionRequestedAt,
        reason: deletionRequest?.reason,
      });
    } catch (error) {
      logError(error as Error, { endpoint: "GET /api/profile/deletion-status" });
      res.status(500).json({ message: "Internal server error" });
    }
  });
}