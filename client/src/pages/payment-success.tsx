import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Check, Calendar, Home, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PaymentSuccess = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const orderId = params.get("orderId");
  const type = params.get("type") || "order";
  const subscriptionId =
    params.get("subscriptionId") || localStorage.getItem("lastSubscriptionId");

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["/api/orders", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const res = await apiRequest("GET", `/api/orders/${orderId}`);
      return await res.json();
    },
    enabled: !!orderId && !!user && type === "order",
  });

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/subscriptions", subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) return null;
      const res = await apiRequest(
        "GET",
        `/api/subscriptions/${subscriptionId}`,
      );
      return await res.json();
    },
    enabled: !!subscriptionId && !!user && type === "subscription",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  const isLoading =
    authLoading ||
    (type === "order" && orderLoading) ||
    (type === "subscription" && subscriptionLoading);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <div className="max-w-md w-full">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="pb-2">
            <div className="mx-auto bg-green-100 dark:bg-green-900 p-2 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Check className="text-green-600 dark:text-green-400 h-6 w-6" />
            </div>
            <CardTitle className="text-center text-2xl text-green-700 dark:text-green-300">
              Payment Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-green-600 dark:text-green-400 mb-6">
              {type === "subscription"
                ? "Your subscription has been activated successfully! Your millet meals will be delivered according to your schedule."
                : "Your payment has been processed successfully. Thank you for your order!"}
            </p>

            {order && type === "order" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4 text-left">
                <h3 className="font-medium mb-2">Order Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Order ID:</div>
                  <div className="font-semibold">{order.id}</div>
                  <div>Amount:</div>
                  <div className="font-semibold">₹{order.totalPrice / 100}</div>
                  <div>Status:</div>
                  <div className="font-semibold capitalize">{order.status}</div>
                </div>
              </div>
            )}

            {subscription && type === "subscription" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4 text-left">
                <h3 className="font-medium mb-2">Subscription Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Plan:</div>
                  <div className="font-semibold capitalize">
                    {subscription.plan}
                  </div>
                  <div>Type:</div>
                  <div className="font-semibold capitalize">
                    {subscription.subscriptionType}
                  </div>
                  <div>Start Date:</div>
                  <div className="font-semibold">
                    {new Date(subscription.startDate).toLocaleDateString()}
                  </div>
                  <div>Status:</div>
                  <div className="font-semibold capitalize">
                    {subscription.status}
                  </div>
                  <div>Monthly Price:</div>
                  <div className="font-semibold">
                    ₹{subscription.price / 100}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            {type === "subscription" ? (
              <Button
                className="w-full"
                onClick={() => navigate("/profile?tab=subscriptions")}
                variant="outline"
              >
                <Calendar className="mr-2 h-4 w-4" />
                View My Subscriptions
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => navigate("/profile?tab=orders")}
                variant="outline"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                View My Orders
              </Button>
            )}

            <Button className="w-full" onClick={() => navigate("/")}>
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Button>

            <Button
              className="w-full"
              onClick={() =>
                navigate(type === "subscription" ? "/meal-planner" : "/menu")
              }
              variant="secondary"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {type === "subscription" ? "View Meal Plan" : "Explore Menu"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;
