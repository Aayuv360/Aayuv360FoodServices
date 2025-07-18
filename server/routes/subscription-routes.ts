import type { Express, Request, Response } from "express";
import { mongoStorage } from "../mongoStorage";
import { insertSubscriptionSchema } from "../../shared/schema";
import { getNextSequence } from "../../shared/mongoModels";
import { logAPIRequest } from "../logger";
import { z } from "zod";
import { authenticateToken } from "../jwt-middleware";

function calculateSubscriptionStatus(subscription: any) {
  try {
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

    if (isNaN(startDate.getTime())) {
      console.log(
        "Invalid start date for subscription:",
        subscription.id,
        "Date value:",
        subscription.startDate || subscription.start_date,
      );
      return {
        ...subscription,
        status: "inactive",
        endDate: null,
        daysRemaining: 0,
      };
    }

    const planDuration =
      subscription.plan?.duration ||
      subscription.duration ||
      subscription.meals_per_month ||
      subscription.mealsPerMonth ||
      30;

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + planDuration);

    if (isNaN(endDate.getTime())) {
      console.log(
        "Invalid end date calculation for subscription:",
        subscription.id,
      );
      return {
        ...subscription,
        status: "inactive",
        endDate: null,
        daysRemaining: 0,
      };
    }

    const current = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
    );
    const start = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );
    const end = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
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
      error,
    );
    return {
      ...subscription,
      status: "inactive",
      endDate: null,
      daysRemaining: 0,
    };
  }
}

export function registerSubscriptionRoutes(app: Express) {
  const isManagerOrAdmin = (req: Request, res: Response, next: Function) => {
    const user = req.user as any;
    if (!user || (user.role !== "manager" && user.role !== "admin")) {
      return res
        .status(403)
        .json({ message: "Access denied. Manager privileges required." });
    }
    next();
  };

  app.get("/api/subscription-plans", async (req, res) => {
    const startTime = Date.now();
    try {
      let subscriptionPlans = CacheService.getSubscriptionPlans();

      if (!subscriptionPlans) {
        console.log("📋 Fetching subscription plans from MongoDB");
        const activePlans = await mongoStorage.getAllSubscriptionPlans();
        const plansWithMenuItems = activePlans.map((plan) => {
          if (!plan.menuItems || plan.menuItems.length === 0) {
            console.warn(`Plan ${plan.id} missing menuItems, adding default`);
            const defaultMenuItems = [
              {
                day: 1,
                main: "Ragi Dosa",
                sides: ["Coconut Chutney", "Sambar"],
              },
              { day: 2, main: "Jowar Upma", sides: ["Mixed Vegetable Curry"] },
              { day: 3, main: "Millet Pulao", sides: ["Raita", "Papad"] },
              {
                day: 4,
                main: "Foxtail Millet Lemon Rice",
                sides: ["Boondi Raita"],
              },
              {
                day: 5,
                main: "Little Millet Pongal",
                sides: ["Coconut Chutney"],
              },
              {
                day: 6,
                main: "Barnyard Millet Khichdi",
                sides: ["Pickle", "Curd"],
              },
              {
                day: 7,
                main: "Pearl Millet Roti",
                sides: ["Dal", "Vegetable Curry"],
              },
            ];
            return { ...plan, menuItems: defaultMenuItems };
          }
          return plan;
        });

        const groupedPlans = [
          {
            dietaryPreference: "veg",
            plans: plansWithMenuItems.filter(
              (plan) => plan.dietaryPreference === "veg",
            ),
            extraPrice: 0,
            id: 1,
          },
          {
            dietaryPreference: "veg_with_egg",
            plans: plansWithMenuItems.filter(
              (plan) => plan.dietaryPreference === "veg_with_egg",
            ),
            extraPrice: 0,
            id: 2,
          },
          {
            dietaryPreference: "nonveg",
            plans: plansWithMenuItems.filter(
              (plan) => plan.dietaryPreference === "nonveg",
            ),
            extraPrice: 0,
            id: 3,
          },
        ].filter((group) => group.plans.length > 0);
        subscriptionPlans = groupedPlans;

        CacheService.setSubscriptionPlans(subscriptionPlans);
      } else {
        console.log(
          `📋 Retrieved ${subscriptionPlans.length} subscription plans from cache`,
        );
      }

      const duration = Date.now() - startTime;
      logAPIRequest(
        "GET",
        "/api/subscription-plans",
        200,
        duration,
        (req.user as any)?.id,
      );

      res.json(subscriptionPlans);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error("Error fetching subscription plans:", error);
      logAPIRequest(
        "GET",
        "/api/subscription-plans",
        500,
        duration,
        (req.user as any)?.id,
      );
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get("/api/subscriptions", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const subscriptions = await mongoStorage.getSubscriptionsByUserId(userId);

      const subscriptionsWithStatus = subscriptions.map((subscription: any) => {
        try {
          return calculateSubscriptionStatus(subscription);
        } catch (statusError) {
          console.error(
            "Failed to calculate status for subscription:",
            subscription.id,
            statusError,
          );
          return {
            ...subscription,
            status: "inactive",
            endDate: null,
            daysRemaining: 0,
          };
        }
      });

      res.json(subscriptionsWithStatus);
    } catch (err) {
      console.error("Error fetching user subscriptions:", err);
      res.status(500).json({ message: "Error fetching subscriptions" });
    }
  });

  app.get("/api/subscriptions/:id", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).role === "admin";
      const subscriptionId = parseInt(req.params.id);

      const subscription = await mongoStorage.getSubscription(subscriptionId);

      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      if (subscription.userId !== userId && !isAdmin) {
        return res.status(403).json({
          message: "You do not have permission to access this subscription",
        });
      }

      const subscriptionWithStatus = calculateSubscriptionStatus(subscription);
      res.json(subscriptionWithStatus);
    } catch (err) {
      console.error("Error fetching subscription:", err);
      res.status(500).json({ message: "Error fetching subscription" });
    }
  });

  app.post(
    "/api/subscriptions/generate-id",
    authenticateToken,
    async (req, res) => {
      try {
        const id = await getNextSequence("subscription");
        res.status(200).json({ id });
      } catch (error) {
        console.error("Error generating subscription ID:", error);
        res.status(500).json({ message: "Failed to generate subscription ID" });
      }
    },
  );

  app.post("/api/subscriptions", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const requestData = {
        ...req.body,
        userId,
        startDate: req.body.startDate
          ? new Date(req.body.startDate)
          : undefined,
        id: req.body.id,
      };

      const subscriptionData = insertSubscriptionSchema.parse(requestData);
      const subscription =
        await mongoStorage.createSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Validation error", errors: err.errors });
      } else {
        console.error("Error creating subscription:", err);
        res.status(500).json({ message: "Error creating subscription" });
      }
    }
  });

  app.post(
    "/api/subscriptions/:id/modify",
    authenticateToken,
    async (req, res) => {
      try {
        const userId = (req.user as any).id;
        const subscriptionId = parseInt(req.params.id, 10);
        const { resumeDate, timeSlot, deliveryAddressId, personCount } =
          req.body;

        const parsedResumeDate = new Date(resumeDate);
        if (!resumeDate || isNaN(parsedResumeDate.getTime())) {
          return res
            .status(400)
            .json({ message: "Invalid or missing resumeDate in request body" });
        }

        const subscription = await mongoStorage.getSubscription(subscriptionId);
        if (!subscription) {
          return res.status(404).json({ message: "Subscription not found" });
        }

        if (subscription.userId !== userId) {
          return res.status(403).json({
            message: "You do not have permission to modify this subscription",
          });
        }

        const planDuration = subscription?.mealsPerMonth;
        if (typeof planDuration !== "number" || planDuration <= 0) {
          console.error(
            "Invalid or missing plan duration for subscription:",
            planDuration,
          );
          return res.status(400).json({
            message: "Invalid or missing plan duration for the subscription.",
          });
        }

        const today = new Date();
        const startDate = new Date(subscription.startDate);

        const deliveredDays = Math.max(
          0,
          Math.floor(
            (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          ) + 1,
        );

        const remainingDays = planDuration - deliveredDays;
        if (remainingDays <= 0) {
          return res
            .status(400)
            .json({ message: "No remaining days in the subscription plan" });
        }

        const addDays = (date: Date, days: number) => {
          const result = new Date(date);
          result.setUTCDate(result.getUTCDate() + days);
          return result;
        };

        const newEndDate =
          remainingDays > 1
            ? addDays(parsedResumeDate, planDuration - 1)
            : addDays(parsedResumeDate, remainingDays - 1);

        const updates = {
          startDate: parsedResumeDate.toISOString(),
          endDate: newEndDate.toISOString(),
          timeSlot,
          deliveryAddressId,
          updatedAt: new Date(),
          personCount,
        };

        const updatedSubscription = await mongoStorage.updateSubscription(
          subscriptionId,
          updates,
        );

        if (!updatedSubscription) {
          return res
            .status(500)
            .json({ message: "Failed to modify subscription" });
        }

        const modifiedSubscriptionWithStatus =
          calculateSubscriptionStatus(updatedSubscription);

        return res.json(modifiedSubscriptionWithStatus);
      } catch (err) {
        console.error("Error modifying subscription:", err);
        return res
          .status(500)
          .json({ message: "Error modifying subscription" });
      }
    },
  );

  app.patch("/api/subscriptions/:id", authenticateToken, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const subscriptionId = parseInt(req.params.id);

      const existingSubscription =
        await mongoStorage.getSubscription(subscriptionId);

      if (!existingSubscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      if (existingSubscription.userId !== userId) {
        return res.status(403).json({
          message: "You do not have permission to modify this subscription",
        });
      }

      const updatedSubscription = await mongoStorage.updateSubscription(
        subscriptionId,
        req.body,
      );
      res.json(updatedSubscription);
    } catch (err) {
      console.error("Error updating subscription:", err);
      res.status(500).json({ message: "Error updating subscription" });
    }
  });

  // Admin subscription plan routes
  app
    .route("/api/admin/subscription-plans")
    .get(authenticateToken, isManagerOrAdmin, async (req, res) => {
      try {
        const plans = await mongoStorage.getAllSubscriptionPlans();
        const plansWithMenuItems = plans;

        const groupedPlans = [
          {
            dietaryPreference: "veg",
            plans: plansWithMenuItems.filter(
              (plan) => plan.dietaryPreference === "veg",
            ),
            extraPrice: 0,
            id: 1,
          },
          {
            dietaryPreference: "veg_with_egg",
            plans: plansWithMenuItems.filter(
              (plan) => plan.dietaryPreference === "veg_with_egg",
            ),
            extraPrice: 0,
            id: 2,
          },
          {
            dietaryPreference: "nonveg",
            plans: plansWithMenuItems.filter(
              (plan) => plan.dietaryPreference === "nonveg",
            ),
            extraPrice: 0,
            id: 3,
          },
        ].filter((group) => group.plans.length > 0);

        res.json(groupedPlans);
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
        res.status(500).json({ message: "Error fetching subscription plans" });
      }
    })
    .post(authenticateToken, isManagerOrAdmin, async (req, res) => {
      try {
        const { action, planData, planId } = req.body;

        if (action === "create") {
          console.log("🚀 Creating subscription plan:", planData);
          const newPlan = await mongoStorage.createSubscriptionPlan(planData);
          res.json({
            success: true,
            message: "Plan created successfully!",
            plan: newPlan,
          });
        } else if (action === "update") {
          console.log("🚀 Updating subscription plan:", planId, planData);
          const updatedPlan = await mongoStorage.updateSubscriptionPlan(
            planId,
            planData,
          );
          res.json({
            success: true,
            message: "Plan updated successfully!",
            plan: updatedPlan,
          });
        } else if (action === "delete") {
          console.log("🚀 Deleting subscription plan:", planId);
          const updatedPlan = await mongoStorage.updateSubscriptionPlan(
            planId,
            { isActive: false },
          );
          res.json({
            success: true,
            message: "Plan deactivated successfully!",
            plan: updatedPlan,
          });
        } else {
          res.status(400).json({ success: false, message: "Invalid action" });
        }
      } catch (error) {
        console.error("Error with subscription plan operation:", error);
        res.status(500).json({
          success: false,
          message: "Error processing subscription plan operation",
        });
      }
    });

  app.put(
    "/api/admin/subscription-plans/:id",
    authenticateToken,
    isManagerOrAdmin,
    async (req: Request, res: Response) => {
      try {
        console.log("🚀 SUBSCRIPTION PLAN UPDATE WORKING!");
        const planId = req.params.id;
        const updateData = req.body;

        const updatedPlan = await mongoStorage.updateSubscriptionPlan(
          planId,
          updateData,
        );

        if (!updatedPlan) {
          return res.status(404).json({
            success: false,
            message: "Subscription plan not found",
          });
        }

        console.log(`✅ Successfully updated subscription plan ${planId}`);
        res.setHeader("Content-Type", "application/json");
        res.status(200).json({
          success: true,
          message: "Plan updated successfully!",
          id: planId,
          data: updatedPlan,
        });
      } catch (error) {
        console.error("Error updating subscription plan:", error);
        res.status(500).json({
          success: false,
          message: "Failed to update subscription plan",
        });
      }
    },
  );
}
