import type { Express, Request, Response } from "express";
import { mongoStorage } from "../mongoStorage";
import { storage } from "../storage";
import { ContactReview } from "../../shared/mongoModels";
import { serveImageFromMongoDB } from "../upload";
import contactRoutes from "../contact-routes";
import { router as deliveryRoutes } from "../delivery-status";
import { router as notificationRoutes } from "../notifications";

export function registerMiscRoutes(app: Express) {
  app.get("/api/images/:id", serveImageFromMongoDB);
  app.use(deliveryRoutes);
  app.use(notificationRoutes);
  app.use(contactRoutes);

  app.get("/api/curry-options", async (req, res) => {
    try {
      const curryOptions = await storage.getCurryOptions();
      res.json(curryOptions);
    } catch (error) {
      console.error("Error fetching curry options:", error);
      res.status(500).json({ message: "Failed to fetch curry options" });
    }
  });

  app.get("/api/curry-options/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const curryOption = await storage.getCurryOption(id);

      if (!curryOption) {
        return res.status(404).json({ message: "Curry option not found" });
      }

      res.json(curryOption);
    } catch (error) {
      console.error("Error fetching curry option:", error);
      res.status(500).json({ message: "Failed to fetch curry option" });
    }
  });

  app.get("/api/meals/:mealId/curry-options", async (req, res) => {
    try {
      const mealId = parseInt(req.params.mealId);
      if (isNaN(mealId)) {
        return res.status(400).json({ message: "Invalid meal ID" });
      }

      const allCurryOptions = await storage.getCurryOptions();
      const mealCurryOptions = allCurryOptions.filter(
        (option: { mealId?: number | null }) =>
          option.mealId === mealId || option.mealId === null,
      );

      res.json(mealCurryOptions);
    } catch (error) {
      console.error("Error fetching meal curry options:", error);
      res.status(500).json({ message: "Failed to fetch meal curry options" });
    }
  });

  app.post("/api/contact-review", async (req, res) => {
    try {
      const { name, email, phone, message, rating } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({
          error: "Name, email, and message are required",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: "Please provide a valid email address",
        });
      }

      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          error: "Rating must be between 1 and 5",
        });
      }

      const contactReview = new ContactReview({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        message: message.trim(),
        rating: rating || 5,
        submittedAt: new Date(),
        status: "new",
      });

      await contactReview.save();

      console.log(`New contact/review submitted by ${name} (${email})`);

      res.status(201).json({
        message: "Thank you for your feedback! We'll get back to you soon.",
        id: contactReview._id,
      });
    } catch (error) {
      console.error("Error saving contact/review:", error);
      res.status(500).json({
        error: "Failed to submit your message. Please try again.",
      });
    }
  });

  app.post("/api/newsletter", async (req, res) => {
    try {
      const result = await mongoStorage.createNewsletterEmail(req.body);
      return res
        .status(201)
        .json({ message: "Subscribed successfully", data: result });
    } catch (error: any) {
      console.error("Newsletter subscription error:", error.message);
      const errorMsg = error.message || "Internal server error";

      const statusCode =
        errorMsg === "Email is required." ||
        errorMsg === "Invalid email format."
          ? 400
          : errorMsg === "Email already subscribed."
            ? 409
            : 500;

      return res.status(statusCode).json({ error: errorMsg });
    }
  });

  app.get("/api/deliveries", async (req, res) => {
    try {
      const user = await mongoStorage.getUser((req.user as any).id);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const deliveries = await mongoStorage.getAllDeliveries();
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  });
}
