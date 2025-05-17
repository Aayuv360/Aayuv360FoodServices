import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, MessageSquare, Phone, Truck, Package, MapPin, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: "app" | "sms" | "whatsapp";
  read: boolean;
  createdAt: string;
}

export function NotificationManager() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("delivery");
  
  // Query to fetch user notifications
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest("GET", "/api/notifications");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
  });
  
  // Query to fetch delivery status updates
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

  const appNotifications = notifications.filter(
    (notification: NotificationItem) => notification.type === "app"
  );
  
  const smsNotifications = notifications.filter(
    (notification: NotificationItem) => notification.type === "sms"
  );
  
  const whatsappNotifications = notifications.filter(
    (notification: NotificationItem) => notification.type === "whatsapp"
  );
  
  // Count unread notifications
  const unreadCount = notifications.filter(
    (notification: NotificationItem) => !notification.read
  ).length;

  // Mark notification as read when viewed
  const markAsRead = async (id: number) => {
    const res = await apiRequest("PUT", `/api/notifications/${id}/read`, {});
    if (res.ok) {
      refetchNotifications();
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const res = await apiRequest("PUT", "/api/notifications/read-all", {});
    if (res.ok) {
      refetchNotifications();
    }
  };

  // Auto-refresh notifications
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (user) {
        refetchNotifications();
        refetchDeliveryUpdates();
      }
    }, 30000); // Refresh every 30 seconds for more real-time updates

    return () => clearInterval(intervalId);
  }, [user, refetchNotifications, refetchDeliveryUpdates]);

  // Render notification items based on type
  const renderNotifications = (notificationList: NotificationItem[]) => {
    if (notificationList.length === 0) {
      return (
        <div className="flex justify-center items-center py-6 text-muted-foreground">
          No notifications available
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-96 overflow-y-auto p-1">
        {notificationList.map((notification) => (
          <Notification
            key={notification.id}
            variant={notification.read ? "default" : "info"}
            title={notification.title}
            description={notification.message}
            className={notification.read ? "opacity-70" : ""}
            onClick={() => markAsRead(notification.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>
              Your messages, alerts and delivery updates.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <Tabs defaultValue="app" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="delivery" className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    <span>Delivery</span>
                    {deliveryUpdates.length > 0 && (
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="app" className="flex items-center gap-1">
                    <Bell className="h-4 w-4" />
                    <span>App</span>
                    {appNotifications.some(n => !n.read) && (
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="sms" className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>SMS</span>
                    {smsNotifications.some(n => !n.read) && (
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>WhatsApp</span>
                    {whatsappNotifications.some(n => !n.read) && (
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                  </TabsTrigger>
                </TabsList>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              </div>
              
              <TabsContent value="delivery">
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
                      
                      return (
                        <Notification
                          key={update.id}
                          variant={variant}
                          title={`Order #${update.orderId} Update`}
                          description={update.message}
                          icon={icon}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex justify-center items-center py-6 text-muted-foreground">
                    No delivery updates available
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="app">
                {renderNotifications(appNotifications)}
              </TabsContent>
              
              <TabsContent value="sms">
                {renderNotifications(smsNotifications)}
              </TabsContent>
              
              <TabsContent value="whatsapp">
                {renderNotifications(whatsappNotifications)}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}