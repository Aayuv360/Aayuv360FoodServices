import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Truck, 
  Clock, 
  CheckCircle, 
  Package,
  Calendar
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

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

export function UserDeliverySchedule() {
  const { user } = useAuth();

  // Fetch user's deliveries
  const { data: userDeliveries, isLoading } = useQuery({
    queryKey: ["/api/delivery/user", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await apiRequest("GET", `/api/delivery/user/${user.id}`);
      return res.json();
    },
    enabled: !!user?.id,
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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Your meal is scheduled for delivery';
      case 'preparing':
        return 'Your meal is being prepared in our kitchen';
      case 'out_for_delivery':
        return 'Your meal is on the way';
      case 'delivered':
        return 'Your meal has been delivered';
      default:
        return 'Status update available';
    }
  };

  // Get today's delivery
  const today = new Date().toISOString().split('T')[0];
  const todayDelivery = userDeliveries?.find((delivery: DeliveryItem) => 
    delivery.scheduledDate.startsWith(today)
  );

  // Get upcoming deliveries (next 7 days)
  const upcomingDeliveries = userDeliveries?.filter((delivery: DeliveryItem) => {
    const deliveryDate = new Date(delivery.scheduledDate);
    const currentDate = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(currentDate.getDate() + 7);
    
    return deliveryDate >= currentDate && deliveryDate <= weekFromNow;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Delivery */}
      {todayDelivery && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Today's Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{todayDelivery.mealPlan.main}</h4>
                <Badge className={getStatusColor(todayDelivery.deliveryStatus)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(todayDelivery.deliveryStatus)}
                    {todayDelivery.deliveryStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Sides:</strong> {todayDelivery.mealPlan.sides.join(", ")}
              </p>
              <p className="text-sm text-blue-600">
                {getStatusMessage(todayDelivery.deliveryStatus)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingDeliveries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No upcoming deliveries scheduled</p>
              <p className="text-sm mt-1">Subscribe to a plan to start receiving meals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingDeliveries.map((delivery: DeliveryItem) => (
                <div
                  key={delivery.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{delivery.mealPlan.main}</h4>
                        <Badge className={getStatusColor(delivery.deliveryStatus)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(delivery.deliveryStatus)}
                            {delivery.deliveryStatus.replace('_', ' ')}
                          </span>
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Date:</strong> {format(new Date(delivery.scheduledDate), "EEEE, MMM d, yyyy")}</p>
                        <p><strong>Sides:</strong> {delivery.mealPlan.sides.join(", ")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delivery Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Delivery Hours</p>
              <p className="text-sm text-blue-700">Daily between 11:00 AM - 2:00 PM and 7:00 PM - 10:00 PM</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Truck className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Free Delivery</p>
              <p className="text-sm text-green-700">All subscription meals include free home delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Package className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-medium text-purple-900">Fresh & Hot</p>
              <p className="text-sm text-purple-700">Meals are prepared fresh and delivered hot to your doorstep</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}