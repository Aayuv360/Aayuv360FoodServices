import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Truck, Package, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notification } from "@/components/ui/notification";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export function NotificationManager() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
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
  const hasActiveOrders = userOrders.length > 0 && userOrders.some((order: any) => 
    !["delivered", "cancelled"].includes(order.status)
  );

  // Query to fetch delivery status updates only when there are active orders
  const { data: deliveryUpdates = [], refetch: refetchDeliveryUpdates } = useQuery({
    queryKey: ["/api/delivery-status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/delivery-status");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user && hasActiveOrders,
    refetchInterval: hasActiveOrders ? 30000 : false,
  });

  // Show only current status for each active order
  const activeUpdates: Record<number, any> = {};
  deliveryUpdates.forEach((update: any) => {
    if (!activeUpdates[update.orderId] || 
        new Date(update.timestamp) > new Date(activeUpdates[update.orderId].timestamp)) {
      // Only include if it's not delivered or cancelled
      if (!["delivered", "cancelled"].includes(update.status)) {
        activeUpdates[update.orderId] = update;
      }
    }
  });

  const currentDeliveryUpdates = Object.values(activeUpdates);
  const updateCount = currentDeliveryUpdates.length;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Truck className="h-5 w-5" />
            {updateCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                {updateCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delivery Updates</DialogTitle>
            <DialogDescription>
              Track your order status and delivery progress
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            {currentDeliveryUpdates.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto p-1">
                {currentDeliveryUpdates.map((update: any) => {
                  // Determine icon and variant based on status
                  let icon = <Truck className="h-5 w-5" />;
                  let variant: "default" | "success" | "warning" | "info" = "default";
                  
                  switch (update.status) {
                    case 'preparing':
                      icon = <Package className="h-5 w-5" />;
                      variant = 'default';
                      break;
                    case 'out_for_delivery':
                      icon = <Truck className="h-5 w-5" />;
                      variant = 'info';
                      break;
                    case 'nearby':
                      icon = <MapPin className="h-5 w-5" />;
                      variant = 'warning';
                      break;
                    case 'delivered':
                      icon = <Package className="h-5 w-5" />;
                      variant = 'success';
                      break;
                  }
                  
                  // Format the timestamp to a readable date and time
                  const formattedTime = new Date(update.timestamp).toLocaleString();
                  
                  return (
                    <Notification
                      key={update.id}
                      variant={variant}
                      title={`Order #${update.orderId} - ${update.status.replace('_', ' ')}`}
                      description={`${update.message}
${formattedTime}
${update.estimatedTime ? `Estimated arrival: ${update.estimatedTime}` : ''}`}
                      icon={icon}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center py-10 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p>No delivery updates yet</p>
                <p className="text-sm mt-1">Your delivery updates will appear here</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}