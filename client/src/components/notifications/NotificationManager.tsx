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
  
  // Query to fetch delivery status updates only
  const { data: deliveryUpdates = [], refetch: refetchDeliveryUpdates } = useQuery({
    queryKey: ["/api/delivery-status"],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest("GET", "/api/delivery-status");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
  });

  // Count total delivery updates for notification badge
  const updateCount = deliveryUpdates.length;

  // Auto-refresh delivery updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (user) {
        refetchDeliveryUpdates();
      }
    }, 30000); // Refresh every 30 seconds for more real-time updates

    return () => clearInterval(intervalId);
  }, [user, refetchDeliveryUpdates]);

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
            {deliveryUpdates.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto p-1">
                {deliveryUpdates.map((update: any) => {
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
                      description={
                        <div>
                          <p>{update.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formattedTime}</p>
                          {update.estimatedTime && (
                            <p className="text-xs font-medium mt-1">
                              Estimated arrival: {update.estimatedTime}
                            </p>
                          )}
                        </div>
                      }
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