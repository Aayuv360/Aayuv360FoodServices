import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Truck, MapPin, Clock, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Notification } from "@/components/ui/notification";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export interface DeliveryStatus {
  id: number;
  orderId: number;
  status:
    | "preparing"
    | "in_transit"
    | "out_for_delivery"
    | "nearby"
    | "delivered";
  message: string;
  estimatedTime?: string;
  location?: string;
  timestamp: string;
}

export function DeliveryNotificationSystem() {
  // This component is no longer needed as notification logic
  // is now handled by NotificationManager to avoid duplicate API calls
  return null;
}

export function DeliveryNotificationList({
  deliveryUpdates = [],
}: {
  deliveryUpdates: DeliveryStatus[];
}) {
  if (deliveryUpdates.length === 0) {
    return (
      <div className="flex justify-center items-center py-6 text-muted-foreground">
        No active deliveries
      </div>
    );
  }

  const latestUpdates: Record<number, DeliveryStatus> = {};
  deliveryUpdates.forEach((update) => {
    if (
      !latestUpdates[update.orderId] ||
      new Date(update.timestamp) >
        new Date(latestUpdates[update.orderId].timestamp)
    ) {
      if (!["delivered", "cancelled"].includes(update.status)) {
        latestUpdates[update.orderId] = update;
      }
    }
  });

  const activeUpdates = Object.values(latestUpdates);

  if (activeUpdates.length === 0) {
    return (
      <div className="flex justify-center items-center py-6 text-muted-foreground">
        No active deliveries
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeUpdates.map((update) => {
        let variant: "default" | "success" | "warning" | "info" = "default";
        let icon = <Truck className="h-5 w-5" />;

        switch (update.status) {
          case "preparing":
            icon = <Package className="h-5 w-5" />;
            variant = "default";
            break;
          case "in_transit":
            icon = <Truck className="h-5 w-5" />;
            variant = "info";
            break;
          case "out_for_delivery":
            icon = <Truck className="h-5 w-5" />;
            variant = "info";
            break;
          case "nearby":
            icon = <MapPin className="h-5 w-5" />;
            variant = "warning";
            break;
          case "delivered":
            icon = <Package className="h-5 w-5" />;
            variant = "success";
            break;
        }

        return (
          <div key={update.orderId} className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <span>Order #{update.orderId}</span>
              {update.estimatedTime && (
                <span className="text-xs text-muted-foreground flex items-center ml-2">
                  <Clock className="h-3 w-3 mr-1" />
                  {update.estimatedTime}
                </span>
              )}
            </h4>

            <Notification
              variant={variant}
              title={`Status: ${update.status.replace("_", " ")}`}
              description={update.message}
              icon={icon}
              className="mb-2"
            />
          </div>
        );
      })}
    </div>
  );
}
