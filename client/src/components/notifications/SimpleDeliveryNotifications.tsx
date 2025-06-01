import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Truck, Package, MapPin, Clock } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface DeliveryUpdate {
  id: number;
  orderId: number;
  status: "preparing" | "in_transit" | "out_for_delivery" | "nearby" | "delivered";
  message: string;
  estimatedTime?: string;
  timestamp: string;
}

export function SimpleDeliveryNotifications() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Only fetch when user clicks the notification bell
  const { data: deliveryUpdates = [], refetch } = useQuery({
    queryKey: ["/api/delivery-status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/delivery-status");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: false, // Never auto-fetch
  });

  // Fetch updates when dialog opens
  const handleOpenDialog = () => {
    setIsOpen(true);
    if (user) {
      refetch();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "preparing":
        return <Package className="h-4 w-4" />;
      case "in_transit":
      case "out_for_delivery":
        return <Truck className="h-4 w-4" />;
      case "nearby":
        return <MapPin className="h-4 w-4" />;
      case "delivered":
        return <Package className="h-4 w-4 text-green-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing":
        return "bg-yellow-100 text-yellow-800";
      case "in_transit":
      case "out_for_delivery":
        return "bg-blue-100 text-blue-800";
      case "nearby":
        return "bg-orange-100 text-orange-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative"
          onClick={handleOpenDialog}
        >
          <Truck className="h-5 w-5" />
          {deliveryUpdates.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
              {deliveryUpdates.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delivery Updates</DialogTitle>
          <DialogDescription>
            Current status of your active orders
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          {deliveryUpdates.length > 0 ? (
            <div className="space-y-3">
              {deliveryUpdates.map((update: DeliveryUpdate) => (
                <div key={update.orderId} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Order #{update.orderId}</h4>
                    <Badge className={getStatusColor(update.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(update.status)}
                        {update.status.replace("_", " ")}
                      </span>
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{update.message}</p>
                  {update.estimatedTime && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {update.estimatedTime}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <Package className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No active deliveries</p>
              <p className="text-sm text-gray-400">Your delivery updates will appear here</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}