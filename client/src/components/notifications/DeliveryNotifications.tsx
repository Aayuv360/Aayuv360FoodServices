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
  status: 'preparing' | 'out_for_delivery' | 'nearby' | 'delivered';
  message: string;
  estimatedTime?: string;
  location?: string;
  timestamp: string;
}

export function DeliveryNotificationSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lastDeliveryStatus, setLastDeliveryStatus] = useState<DeliveryStatus | null>(null);

  // Query to get delivery status updates
  const { data: deliveryUpdates = [], refetch } = useQuery({
    queryKey: ["/api/delivery-status"],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest("GET", "/api/delivery-status");
      if (!res.ok) return [];
      return await res.json();
    },
    refetchInterval: 60000, // Refetch every minute
    enabled: !!user,
  });

  // Process new delivery updates
  useEffect(() => {
    if (deliveryUpdates.length === 0) return;

    // Sort by timestamp to get the latest update
    const sortedUpdates = [...deliveryUpdates].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const latestUpdate = sortedUpdates[0];
    
    // Only show a notification if it's a new update
    if (lastDeliveryStatus === null || latestUpdate.id !== lastDeliveryStatus.id) {
      setLastDeliveryStatus(latestUpdate);
      
      // Show different notification depending on delivery status
      let icon, variant;
      switch (latestUpdate.status) {
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
        default:
          icon = <Truck className="h-5 w-5" />;
          variant = 'default';
      }
      
      // Show toast notification
      toast({
        title: `Order #${latestUpdate.orderId} Update`,
        description: latestUpdate.message,
        variant: variant as any,
      });
    }
  }, [deliveryUpdates, lastDeliveryStatus, toast]);

  return null; // This component doesn't render anything
}

// Component to display a list of delivery notifications
export function DeliveryNotificationList({ 
  deliveryUpdates = [] 
}: { 
  deliveryUpdates: DeliveryStatus[] 
}) {
  if (deliveryUpdates.length === 0) {
    return (
      <div className="flex justify-center items-center py-6 text-muted-foreground">
        No delivery updates available
      </div>
    );
  }

  // Group delivery updates by order ID
  const groupedUpdates: Record<number, DeliveryStatus[]> = {};
  deliveryUpdates.forEach(update => {
    if (!groupedUpdates[update.orderId]) {
      groupedUpdates[update.orderId] = [];
    }
    groupedUpdates[update.orderId].push(update);
  });

  return (
    <div className="space-y-4">
      {Object.entries(groupedUpdates).map(([orderId, updates]) => {
        // Sort updates by timestamp (newest first)
        const sortedUpdates = [...updates].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        const latestUpdate = sortedUpdates[0];
        
        // Determine variant based on status
        let variant: "default" | "success" | "warning" | "info" = "default";
        let icon = <Truck className="h-5 w-5" />;
        
        switch (latestUpdate.status) {
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
        
        return (
          <div key={orderId} className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <span>Order #{orderId}</span>
              {latestUpdate.estimatedTime && (
                <span className="text-xs text-muted-foreground flex items-center ml-2">
                  <Clock className="h-3 w-3 mr-1" />
                  {latestUpdate.estimatedTime}
                </span>
              )}
            </h4>
            
            <Notification
              variant={variant}
              title={`Status: ${latestUpdate.status.replace('_', ' ')}`}
              description={latestUpdate.message}
              icon={icon}
              className="mb-2"
            />
            
            {sortedUpdates.length > 1 && (
              <div className="ml-6 border-l-2 pl-4 space-y-2 pt-2">
                <p className="text-xs text-muted-foreground">Previous updates:</p>
                {sortedUpdates.slice(1, 3).map((update) => (
                  <div key={update.id} className="text-xs">
                    <p className="font-medium">{new Date(update.timestamp).toLocaleString()}</p>
                    <p className="text-muted-foreground">{update.message}</p>
                  </div>
                ))}
                {sortedUpdates.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    + {sortedUpdates.length - 3} more updates
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}