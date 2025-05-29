import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Truck, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Package,
  Send,
  Calendar
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface DeliveryItem {
  id: number;
  userId: number;
  subscriptionId: number;
  scheduledDate: string;
  mealPlan: {
    main: string;
    sides: string[];
  };
  deliveryStatus: 'scheduled' | 'preparing' | 'out_for_delivery' | 'delivered';
  notificationSent: boolean;
  createdAt: string;
}

export function DeliveryManagement() {
  const { toast } = useToast();
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryItem | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");

  // Fetch today's deliveries
  const { data: todayDeliveries, isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ["/api/delivery/today"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/delivery/today");
      return res.json();
    },
  });

  // Fetch weekly delivery schedule
  const { data: weeklySchedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ["/api/delivery/schedule"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/delivery/schedule");
      return res.json();
    },
  });

  // Send today's delivery notifications
  const sendNotificationsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/send-today-deliveries");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Notifications sent",
        description: `Successfully sent ${data.sent} notifications. ${data.failed} failed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/today"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notifications",
        variant: "destructive",
      });
    },
  });

  // Send status update notification
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ userId, status, estimatedTime }: { userId: number; status: string; estimatedTime?: string }) => {
      const res = await apiRequest("POST", "/api/notifications/delivery-status", {
        userId,
        status,
        estimatedTime,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status update sent",
        description: "Customer has been notified about the status change.",
      });
      setIsStatusDialogOpen(false);
      setSelectedDelivery(null);
      setStatusMessage("");
      setEstimatedTime("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send status update",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'preparing':
        return <Package className="h-4 w-4" />;
      case 'out_for_delivery':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const openStatusDialog = (delivery: DeliveryItem) => {
    setSelectedDelivery(delivery);
    setIsStatusDialogOpen(true);
  };

  const handleSendStatusUpdate = () => {
    if (!selectedDelivery) return;
    
    statusUpdateMutation.mutate({
      userId: selectedDelivery.userId,
      status: statusMessage,
      estimatedTime: estimatedTime || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Delivery Management</h2>
        <Button
          onClick={() => sendNotificationsMutation.mutate()}
          disabled={sendNotificationsMutation.isPending || !todayDeliveries?.length}
          className="flex items-center gap-2"
        >
          {sendNotificationsMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send Today's Notifications
        </Button>
      </div>

      {/* Today's Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Today's Deliveries ({format(new Date(), "MMM d, yyyy")})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDeliveries ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !todayDeliveries || todayDeliveries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No deliveries scheduled for today
            </div>
          ) : (
            <div className="space-y-4">
              {todayDeliveries.map((delivery: DeliveryItem) => (
                <div
                  key={delivery.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">User ID: {delivery.userId}</h4>
                        <Badge className={getStatusColor(delivery.deliveryStatus)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(delivery.deliveryStatus)}
                            {delivery.deliveryStatus.replace('_', ' ').toUpperCase()}
                          </span>
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Main:</strong> {delivery.mealPlan.main}</p>
                        <p><strong>Sides:</strong> {delivery.mealPlan.sides.join(", ")}</p>
                        <p><strong>Subscription:</strong> #{delivery.subscriptionId}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openStatusDialog(delivery)}
                        className="flex items-center gap-1"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Update Status
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Schedule Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Delivery Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSchedule ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weeklySchedule && Object.entries(weeklySchedule).map(([date, deliveries]: [string, any]) => (
                <div key={date} className="border rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-2">
                    {format(new Date(date), "MMM d")}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {deliveries.length} deliveries
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Status Update</DialogTitle>
            <DialogDescription>
              Send a status notification to the customer
            </DialogDescription>
          </DialogHeader>
          
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Customer: User #{selectedDelivery.userId}</p>
                <p className="text-sm text-gray-600">{selectedDelivery.mealPlan.main}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Status Message</label>
                <select
                  className="w-full mt-1 p-2 border rounded-md"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                >
                  <option value="">Select status...</option>
                  <option value="preparing">Order is being prepared</option>
                  <option value="out_for_delivery">Out for delivery</option>
                  <option value="nearby">Delivery partner is nearby</option>
                  <option value="delivered">Order delivered</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Estimated Time (optional)</label>
                <Input
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="e.g., 15 minutes, 2:30 PM"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendStatusUpdate}
              disabled={!statusMessage || statusUpdateMutation.isPending}
            >
              {statusUpdateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Update
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}