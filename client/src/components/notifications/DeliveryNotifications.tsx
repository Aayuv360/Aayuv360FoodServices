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
  status: "preparing" | "in_transit" | "out_for_delivery" | "nearby" | "delivered";
  message: string;
  estimatedTime?: string;
  location?: string;
  timestamp: string;
}

export function DeliveryNotificationSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lastDeliveryStatus, setLastDeliveryStatus] =
    useState<DeliveryStatus | null>(null);

  // Check if user has active orders first
  const { data: userOrders = [] } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest("GET", "/api/orders");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
  });

  // Only check delivery status if user has active orders
  const hasActiveOrders = userOrders.some((order: any) => 
    !["delivered", "cancelled"].includes(order.status)
  );

  const { data: deliveryUpdates = [], refetch } = useQuery({
    queryKey: ["/api/delivery-status"],
    queryFn: async () => {
      if (!user || !hasActiveOrders) return [];
      const res = await apiRequest("GET", "/api/delivery-status");
      if (!res.ok) return [];
      return await res.json();
    },
    refetchInterval: 60000,
    enabled: !!user && hasActiveOrders,
  });

  useEffect(() => {
    if (deliveryUpdates.length === 0) return;

    const sortedUpdates = [...deliveryUpdates].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const latestUpdate = sortedUpdates[0];

    if (
      lastDeliveryStatus === null ||
      latestUpdate.id !== lastDeliveryStatus.id
    ) {
      setLastDeliveryStatus(latestUpdate);

      let icon, variant;
      switch (latestUpdate.status) {
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
        default:
          icon = <Truck className="h-5 w-5" />;
          variant = "default";
      }

      toast({
        title: `Order #${latestUpdate.orderId} Update`,
        description: latestUpdate.message,
        variant: variant as any,
      });
    }
  }, [deliveryUpdates, lastDeliveryStatus, toast]);

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

  // Get only the latest status for each active order
  const latestUpdates: Record<number, DeliveryStatus> = {};
  deliveryUpdates.forEach((update) => {
    if (!latestUpdates[update.orderId] || 
        new Date(update.timestamp) > new Date(latestUpdates[update.orderId].timestamp)) {
      // Only include if it's not delivered or cancelled
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