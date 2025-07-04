import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mongoStorage } from "./mongoStorage";
import { z } from "zod";
import { analyticsService, AnalyticsDateRange } from "./analytics";
import { formatCurryOptions } from "./curry-formatter";
import { registerMealRoutes } from "./meals-routes";
import {
  createOrder,
  handlePaymentSuccess,
  handlePaymentFailure,
  handleWebhookEvent,
  verifyPaymentSignature,
  orderPaymentMap,
  subscriptionPaymentMap,
} from "./razorpay";
import {
  Meal as MealModel,
  CartItem as CartItemModel,
  CurryOption,
  getNextSequence,
} from "../shared/mongoModels";
import { updateOrderDeliveryStatus } from "./delivery-status";
import { deliveryScheduler } from "./delivery-scheduler";
import { smsService } from "./sms-service";
import {
  upload,
  processImage,
  deleteImage,
  serveImageFromMongoDB,
} from "./upload";
import {
  insertSubscriptionSchema,
  insertAddressSchema,
  Meal,
  CartItem,
} from "@shared/schema";
import { seedDatabase } from "./seed";
import { setupAuth } from "./auth";
import { sendDailyDeliveryNotifications } from "./subscription-notifications";
import { ContactReview } from "../shared/mongoModels";
import express, { NextFunction } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { router as deliveryRoutes } from "./delivery-status";
import { router as notificationRoutes } from "./notifications";
import contactRoutes from "./contact-routes";
import CacheService from "./cache";
import { logAPIRequest } from "./logger";
import { registerAuthRoutes } from "./routes/auth-routes";
import { registerMealRoutes as registerMealRoutesNew } from "./routes/meal-routes";
import { registerCartRoutes } from "./routes/cart-routes";
import { registerSubscriptionRoutes } from "./routes/subscription-routes";
import { registerOrderRoutes } from "./routes/order-routes";
import { registerAdminRoutes } from "./routes/admin-routes";
import { registerPaymentRoutes } from "./routes/payment-routes";
import { registerLocationRoutes } from "./routes/location-routes";
import { registerMiscRoutes } from "./routes/misc-routes";

const insertUserPreferencesSchema = z.object({
  userId: z.number(),
  dietaryPreferences: z.array(z.string()).optional(),
  spiceLevel: z.string().optional(),
  allergies: z.array(z.string()).optional(),
});

const insertCustomMealPlanSchema = z.object({
  subscriptionId: z.number(),
  dayOfWeek: z.number(),
  mealId: z.number(),
});

interface CartItemWithMeal extends CartItem {
  meal?: Meal & {
    curryOption?: {
      id: string;
      name: string;
      priceAdjustment: number;
    };
    originalName?: string;
  };
}

// Utility function to calculate subscription status
function calculateSubscriptionStatus(subscription: any) {
  try {
    // Handle various startDate formats from different storage systems
    let startDate;
    if (subscription.startDate) {
      startDate = new Date(subscription.startDate);
    } else if (subscription.start_date) {
      startDate = new Date(subscription.start_date);
    } else if (subscription.createdAt) {
      startDate = new Date(subscription.createdAt);
    } else if (subscription.created_at) {
      startDate = new Date(subscription.created_at);
    } else {
      console.log("No valid date found for subscription:", subscription.id);
      return {
        ...subscription,
        status: "inactive",
        endDate: null,
        daysRemaining: 0,
      };
    }

    const currentDate = new Date();

    // Validate the start date
    if (isNaN(startDate.getTime())) {
      console.log(
        "Invalid start date for subscription:",
        subscription.id,
        "Date value:",
        subscription.startDate || subscription.start_date
      );
      return {
        ...subscription,
        status: "inactive",
        endDate: null,
        daysRemaining: 0,
      };
    }

    // Get duration from various possible sources
    const planDuration =
      subscription.plan?.duration ||
      subscription.duration ||
      subscription.meals_per_month ||
      subscription.mealsPerMonth ||
      30;

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + planDuration);

    // Validate the end date
    if (isNaN(endDate.getTime())) {
      console.log(
        "Invalid end date calculation for subscription:",
        subscription.id
      );
      return {
        ...subscription,
        status: "inactive",
        endDate: null,
        daysRemaining: 0,
      };
    }

    // Reset time components for accurate date comparison
    const current = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );
    const start = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    const end = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );

    let status = "inactive";
    if (current < start) {
      status = "inactive";
    } else if (current.getTime() === end.getTime()) {
      status = "completed";
    } else if (current >= start && current < end) {
      status = "active";
    } else {
      status = "completed";
    }

    const daysRemaining =
      status === "active"
        ? Math.ceil((end.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const finalEndDate = isNaN(endDate.getTime())
      ? null
      : endDate.toISOString();

    return {
      ...subscription,
      status,
      endDate: finalEndDate,
      daysRemaining,
    };
  } catch (error) {
    console.error(
      "Error calculating subscription status for subscription:",
      subscription.id,
      error
    );
    return {
      ...subscription,
      status: "inactive",
      endDate: null,
      daysRemaining: 0,
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    await seedDatabase();
  } catch (error) {
    console.error("Error seeding database:", error);
  }

  // Register all route modules
  registerAuthRoutes(app);
  registerMealRoutes(app); // Keep existing meal routes from meals-routes.ts
  registerMealRoutesNew(app); // Add new meal routes
  registerCartRoutes(app);
  registerSubscriptionRoutes(app);
  registerOrderRoutes(app);
  registerAdminRoutes(app);
  registerPaymentRoutes(app);
  registerLocationRoutes(app);
  registerMiscRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}