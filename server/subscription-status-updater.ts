
import { mongoStorage } from "./mongoStorage";

export interface StatusUpdateResult {
  updated: number;
  errors: number;
}

export async function updateAllSubscriptionStatuses(): Promise<StatusUpdateResult> {
  let updated = 0;
  let errors = 0;

  try {
    const subscriptions = await mongoStorage.getAllSubscriptions();

    for (const subscription of subscriptions) {
      try {
        const newStatus = calculateSubscriptionStatus(subscription);

        // Only update if status has changed
        if (newStatus !== subscription.status) {
          await mongoStorage.updateSubscription(subscription.id, {
            status: newStatus,
            updatedAt: new Date()
          });

          console.log(`Updated subscription ${subscription.id} status from ${subscription.status} to ${newStatus}`);
          updated++;
        }
      } catch (error) {
        console.error(`Error updating subscription ${subscription.id}:`, error);
        errors++;
      }
    }

    console.log(`Subscription status update completed: ${updated} updated, ${errors} errors`);
    return { updated, errors };
  } catch (error) {
    console.error("Error in updateAllSubscriptionStatuses:", error);
    return { updated: 0, errors: 1 };
  }
}

function calculateSubscriptionStatus(subscription: any): string {
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
      return "inactive";
    }

    const currentDate = new Date();

    // Validate the start date
    if (isNaN(startDate.getTime())) {
      console.log(
        "Invalid start date for subscription:",
        subscription.id,
        "Date value:",
        subscription.startDate || subscription.start_date,
      );
      return "inactive";
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
        subscription.id,
      );
      return "inactive";
    }

    // Reset time components for accurate date comparison
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
      status = "pending"; // Keep pending if subscription hasn't started yet
    } else if (current.getTime() === end.getTime()) {
      status = "completed";
    } else if (current >= start && current < end) {
      status = "active";
    } else {
      status = "completed";
    }

    return status;
  } catch (error) {
    console.error(
      "Error calculating subscription status for subscription:",
      subscription.id,
      error,
    );
    return "inactive";
  }
}

// Schedule automatic status updates every hour
export function scheduleStatusUpdates() {
  // Run immediately on startup
  updateAllSubscriptionStatuses();

  // Then run every hour
  setInterval(() => {
    updateAllSubscriptionStatuses();
  }, 60 * 60 * 1000); // 1 hour in milliseconds

  console.log("Subscription status updater scheduled to run every hour");
}
