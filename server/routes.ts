import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mongoStorage } from "./mongoStorage";
import { registerMealRoutes } from "./meals-routes";
import { CurryOption } from "../shared/mongoModels";
import { serveImageFromMongoDB } from "./upload";
import { insertAddressSchema } from "@shared/schema";
import { seedDatabase } from "./seed";
import { setupAuth } from "./auth";
import { router as deliveryRoutes } from "./delivery-status";
import { router as notificationRoutes } from "./notifications";
import { router as trackingRoutes } from "./real-time-tracking";
import { registerAuthRoutes } from "./routes/auth-routes";
import { registerMealRoutes as registerMealRoutesNew } from "./routes/meal-routes";
import { registerCartRoutes } from "./routes/cart-routes";
import { registerSubscriptionRoutes } from "./routes/subscription-routes";
import { registerOrderRoutes } from "./routes/order-routes";
import { registerAdminRoutes } from "./routes/admin-routes";
import { registerPaymentRoutes } from "./routes/payment-routes";
import { registerLocationRoutes } from "./routes/location-routes";
import { registerMiscRoutes } from "./routes/misc-routes";
import { registerProfileRoutes } from "./routes/profile-routes";
import { authenticateToken, requireAdmin } from "./jwt-middleware";
import { registerTestAuthRoutes } from "./test-auth";

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    await seedDatabase();
  } catch (error) {
    console.error("Error seeding database:", error);
  }

  setupAuth(app);

  registerAuthRoutes(app);
  registerMealRoutes(app);
  registerMealRoutesNew(app);
  registerCartRoutes(app);
  registerSubscriptionRoutes(app);
  registerOrderRoutes(app);
  registerAdminRoutes(app);
  registerPaymentRoutes(app);
  registerLocationRoutes(app);
  registerMiscRoutes(app);
  registerProfileRoutes(app);
  registerTestAuthRoutes(app);

  app.use("/api/delivery", deliveryRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.get("/api/images/:id", serveImageFromMongoDB);
  app.get("/api/addresses", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const addresses = await mongoStorage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      res.status(500).json({ message: "Error fetching addresses" });
    }
  });

  app.post("/api/addresses", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const addressData = { ...req.body, userId };

      const result = insertAddressSchema.safeParse(addressData);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid address data",
          errors: result.error.errors,
        });
      }

      const address = await mongoStorage.createAddress(result.data);
      res.status(201).json(address);
    } catch (error) {
      console.error("Error creating address:", error);
      res.status(500).json({ message: "Error creating address" });
    }
  });

  app.patch("/api/addresses/:id", authenticateToken, async (req, res) => {
    try {
      const addressId = parseInt(req.params.id);
      const userId = (req.user as any).id;

      const address = await mongoStorage.getAddress(addressId);
      if (!address || address.userId !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }

      const updatedAddress = await mongoStorage.updateAddress(
        addressId,
        req.body,
      );
      res.json(updatedAddress);
    } catch (error) {
      console.error("Error updating address:", error);
      res.status(500).json({ message: "Error updating address" });
    }
  });

  app.delete("/api/addresses/:id", authenticateToken, async (req, res) => {
    try {
      const addressId = parseInt(req.params.id);
      const userId = (req.user as any).id;

      const address = await mongoStorage.getAddress(addressId);
      if (!address || address.userId !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }

      await mongoStorage.deleteAddress(addressId);
      res.json({ message: "Address deleted successfully" });
    } catch (error) {
      console.error("Error deleting address:", error);
      res.status(500).json({ message: "Error deleting address" });
    }
  });

  app.get(
    "/api/admin/curry-options",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const curryOptions = await CurryOption.find().lean();
        res.json(curryOptions);
      } catch (error) {
        console.error("Error fetching curry options:", error);
        res.status(500).json({ message: "Error fetching curry options" });
      }
    },
  );

  app.post(
    "/api/admin/curry-options",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const curryOption = await CurryOption.create(req.body);
        res.status(201).json(curryOption);
      } catch (error) {
        console.error("Error creating curry option:", error);
        res.status(500).json({ message: "Error creating curry option" });
      }
    },
  );
  app.put(
    "/api/admin/curry-options/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const id = req.params.id;

        if (!id || id === "undefined") {
          return res.status(400).json({ message: "Invalid curry option ID" });
        }
        let mealIds = req.body.mealIds || [];
        if (mealIds && Array.isArray(mealIds)) {
          mealIds = mealIds.map((id) =>
            typeof id === "string" ? parseInt(id) : id,
          );
        }

        const updateData = {
          ...req.body,
          mealIds,
          updatedAt: new Date(),
        };

        const updatedCurryOption = await storage.updateCurryOption(
          id,
          updateData,
        );

        if (!updatedCurryOption) {
          return res.status(404).json({ message: "Curry option not found" });
        }

        res.json(updatedCurryOption);
      } catch (error) {
        console.error("Error updating curry option:", error);
        res.status(500).json({ message: "Failed to update curry option" });
      }
    },
  );

  app.patch(
    "/api/admin/curry-options/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { optionData } = req.body;

        const updatedOption = await CurryOption.findOneAndUpdate(
          { id },
          { $set: optionData },
          { new: true },
        );

        if (!updatedOption) {
          return res.status(404).json({ message: "Curry option not found" });
        }

        res.json(updatedOption);
      } catch (error) {
        console.error("Error updating curry option:", error);
        res.status(500).json({ message: "Error updating curry option" });
      }
    },
  );

  app.delete(
    "/api/admin/curry-options/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;

        const deletedOption = await CurryOption.findOneAndDelete({ id });

        if (!deletedOption) {
          return res.status(404).json({ message: "Curry option not found" });
        }

        res.json({ message: "Curry option deleted successfully" });
      } catch (error) {
        console.error("Error deleting curry option:", error);
        res.status(500).json({ message: "Error deleting curry option" });
      }
    },
  );

  app.use("/api", trackingRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
