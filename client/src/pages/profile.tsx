import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, UserCircle, ClockIcon, History, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";


const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().min(1, "Address is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<number | null>(null);
  
  // Parse the URL search params to get the active tab
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const [currentTab, setCurrentTab] = useState(tabParam || "profile");
  
  const toggleOrderDetails = (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };
  
  const toggleSubscriptionDetails = (subscriptionId: number) => {
    if (expandedSubscriptionId === subscriptionId) {
      setExpandedSubscriptionId(null);
    } else {
      setExpandedSubscriptionId(subscriptionId);
    }
  };
  
  // Update tab when URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setCurrentTab(tabParam);
    }
  }, [location]);

  if (!user) {
    navigate("/login");
    return null;
  }

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    enabled: currentTab === "orders",
  });

  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } =
    useQuery<any[]>({
      queryKey: ["/api/subscriptions"],
      enabled: currentTab === "subscriptions",
    });

  // Using imported formatPrice function from utils for consistent price formatting without decimals

  const defaultValues: ProfileFormValues = {
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description:
          error.message || "There was an error updating your profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  const getSubscriptionStatusClass = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getOrderStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-light py-6 sm:py-12">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-3 sm:space-y-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col items-center space-y-3 sm:space-y-4 py-4 sm:py-6">
                  <UserCircle className="h-16 w-16 sm:h-20 sm:w-20 text-primary" />
                  <div className="text-center">
                    <h2 className="text-lg sm:text-xl font-bold">{user.name}</h2>
                    <p className="text-gray-500 text-xs sm:text-sm">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2 mt-4 sm:mt-6">
                  <Button
                    variant={currentTab === "profile" ? "default" : "ghost"}
                    className="w-full justify-start text-xs sm:text-sm h-auto py-1.5 sm:py-2"
                    onClick={() => {
                      setCurrentTab("profile");
                      navigate("/profile", { replace: true });
                    }}
                  >
                    <UserCircle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Profile
                  </Button>
                  <Button
                    variant={
                      currentTab === "subscriptions" ? "default" : "ghost"
                    }
                    className="w-full justify-start text-xs sm:text-sm h-auto py-1.5 sm:py-2"
                    onClick={() => {
                      setCurrentTab("subscriptions"); 
                      navigate("/profile?tab=subscriptions", { replace: true });
                    }}
                  >
                    <ClockIcon className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Subscriptions
                  </Button>
                  <Button
                    variant={currentTab === "orders" ? "default" : "ghost"}
                    className="w-full justify-start text-xs sm:text-sm h-auto py-1.5 sm:py-2"
                    onClick={() => {
                      setCurrentTab("orders");
                      navigate("/profile?tab=orders", { replace: true });
                    }}
                  >
                    <History className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Order History
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs sm:text-sm h-auto py-1.5 sm:py-2 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    onClick={logout}
                  >
                    <LogOut className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            {currentTab === "profile" && (
              <Card>
                <CardHeader className="py-4 sm:py-6">
                  <CardTitle className="text-lg sm:text-xl">Your Profile</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Manage your account information and delivery address
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4 sm:space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                className="text-xs sm:text-sm h-8 sm:h-10" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Email</FormLabel>
                            <FormControl>
                              <Input 
                                className="text-xs sm:text-sm h-8 sm:h-10" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Phone Number</FormLabel>
                            <FormControl>
                              <Input 
                                className="text-xs sm:text-sm h-8 sm:h-10" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Delivery Address</FormLabel>
                            <FormControl>
                              <Input 
                                className="text-xs sm:text-sm h-8 sm:h-10" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="bg-primary hover:bg-primary/90 text-xs sm:text-sm h-auto py-1.5 sm:py-2 mt-2 sm:mt-4"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : null}
                        {updateProfileMutation.isPending
                          ? "Saving..."
                          : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {currentTab === "subscriptions" && (
              <Card>
                <CardHeader className="py-4 sm:py-6">
                  <CardTitle className="text-lg sm:text-xl">Your Subscriptions</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Manage your active meal plans and subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  {isLoadingSubscriptions ? (
                    <div className="flex justify-center py-6 sm:py-8">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                    </div>
                  ) : !subscriptions || subscriptions.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 bg-neutral-light rounded-lg">
                      <h3 className="text-base sm:text-lg font-medium mb-1.5 sm:mb-2">
                        No active subscriptions
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                        You don't have any active subscriptions yet.
                      </p>
                      <Button
                        asChild
                        className="bg-primary hover:bg-primary/90 text-xs sm:text-sm h-auto py-1.5 sm:py-2"
                      >
                        <a href="/subscription">Browse Plans</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {subscriptions.map((subscription: any) => (
                        <div
                          key={subscription.id}
                          className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                        >
                          {/* Subscription Header - Always Visible */}
                          <div 
                            className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 cursor-pointer"
                            onClick={() => toggleSubscriptionDetails(subscription.id)}
                          >
                            <div>
                              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                <h3 className="text-base sm:text-lg font-bold capitalize">
                                  {subscription.plan} Plan
                                </h3>
                                <span
                                  className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${getSubscriptionStatusClass(
                                    subscription.isActive,
                                  )}`}
                                >
                                  {subscription.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
                                {subscription.mealsPerMonth} meals per month
                              </p>
                              <div className="text-xs sm:text-sm text-gray-500">
                                <p>
                                  Started:{" "}
                                  {format(
                                    new Date(subscription.startDate),
                                    "MMM d, yyyy",
                                  )}
                                </p>
                                {subscription.endDate && (
                                  <p>
                                    Ends:{" "}
                                    {format(
                                      new Date(subscription.endDate),
                                      "MMM d, yyyy",
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end mt-2 sm:mt-0">
                              <p className="text-base sm:text-xl font-bold text-primary mb-0 sm:mb-2">
                                {formatPrice(subscription.price)}
                                <span className="text-xs sm:text-sm text-gray-500">
                                  /month
                                </span>
                              </p>
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <Button
                                  variant="outline"
                                  className="border-primary text-primary hover:bg-primary hover:text-white text-xs sm:text-sm h-7 sm:h-9 py-0 px-2 sm:px-3"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Manage action
                                  }}
                                >
                                  Manage
                                </Button>
                                <ChevronRight 
                                  className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform ${expandedSubscriptionId === subscription.id ? 'rotate-90' : ''}`} 
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Expanded Subscription Details */}
                          {expandedSubscriptionId === subscription.id && (
                            <div className="border-t mt-3 sm:mt-4 pt-3 sm:pt-4">
                              {/* Subscription Details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                {/* Left Column */}
                                <div>
                                  <h4 className="font-medium mb-3">Subscription Details</h4>
                                  <div className="bg-neutral-50 p-4 rounded-md space-y-3">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Subscription ID:</span>
                                      <span className="font-medium">{subscription.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Status:</span>
                                      <span className={`font-medium ${subscription.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                        {subscription.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Plan Type:</span>
                                      <span className="font-medium capitalize">{subscription.plan}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Next Billing:</span>
                                      <span className="font-medium">
                                        {format(
                                          new Date(subscription.nextBillingDate || new Date(subscription.startDate).setMonth(new Date(subscription.startDate).getMonth() + 1)),
                                          "MMMM d, yyyy"
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Payment Method:</span>
                                      <span className="font-medium capitalize">{subscription.paymentMethod || 'Credit Card'}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Right Column */}
                                <div>
                                  <h4 className="font-medium mb-3">Plan Benefits</h4>
                                  <div className="bg-neutral-50 p-4 rounded-md space-y-3">
                                    <div className="flex items-center gap-2">
                                      <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      </span>
                                      <span>{subscription.mealsPerMonth} meals per month</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      </span>
                                      <span>Free delivery on all orders</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      </span>
                                      <span>Customize meal plan options</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      </span>
                                      <span>Priority customer support</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action Buttons for Subscription */}
                              <div className="flex flex-wrap gap-3 mt-6">
                                <Button variant="default" className="bg-primary hover:bg-primary/90">
                                  Modify Subscription
                                </Button>
                                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                                  View Meal Plan
                                </Button>
                                <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                                  Cancel Subscription
                                </Button>
                              </div>
                              
                              {/* Upcoming Deliveries */}
                              {subscription.isActive && (
                                <div className="mt-6">
                                  <h4 className="font-medium mb-3">Upcoming Deliveries</h4>
                                  <div className="border rounded-md overflow-hidden">
                                    <div className="bg-gray-50 p-3 border-b">
                                      <div className="grid grid-cols-3 font-medium">
                                        <div>Date</div>
                                        <div>Status</div>
                                        <div>Actions</div>
                                      </div>
                                    </div>
                                    <div className="divide-y">
                                      {/* Generate next 2 upcoming deliveries */}
                                      {[...Array(2)].map((_, index) => {
                                        const deliveryDate = new Date();
                                        deliveryDate.setDate(deliveryDate.getDate() + (index + 1) * 7);
                                        
                                        return (
                                          <div key={index} className="p-3 grid grid-cols-3 items-center">
                                            <div>{format(deliveryDate, "MMMM d, yyyy")}</div>
                                            <div>
                                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                Scheduled
                                              </span>
                                            </div>
                                            <div>
                                              <Button variant="ghost" size="sm" className="h-8 px-2 text-primary">
                                                Customize
                                              </Button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentTab === "orders" && (
              <Card>
                <CardHeader className="py-4 sm:py-6">
                  <CardTitle className="text-lg sm:text-xl">Order History</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    View your past orders and delivery status
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  {isLoadingOrders ? (
                    <div className="flex justify-center py-6 sm:py-8">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                    </div>
                  ) : !orders || orders.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 bg-neutral-light rounded-lg">
                      <h3 className="text-base sm:text-lg font-medium mb-1.5 sm:mb-2">
                        No orders yet
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                        You haven't placed any orders yet.
                      </p>
                      <Button
                        asChild
                        className="bg-primary hover:bg-primary/90 text-xs sm:text-sm h-auto py-1.5 sm:py-2"
                      >
                        <a href="/menu">Browse Menu</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {orders.map((order: any) => (
                        <div 
                          key={order.id} 
                          className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                        >
                          <div 
                            className="flex flex-col sm:flex-row justify-between mb-3 sm:mb-4 gap-2 cursor-pointer"
                            onClick={() => toggleOrderDetails(order.id)}
                          >
                            <div>
                              <p className="text-xs sm:text-sm text-gray-500">
                                Order #{order.id}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {format(
                                  new Date(order.createdAt),
                                  "MMM d, yyyy",
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <span
                                className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full capitalize ${getOrderStatusClass(
                                  order.status,
                                )}`}
                              >
                                {order.status}
                              </span>
                              <p className="text-sm sm:text-base font-bold text-primary">
                                {formatPrice(order.totalPrice)}
                              </p>
                              <ChevronRight 
                                className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform ${expandedOrderId === order.id ? 'rotate-90' : ''}`} 
                              />
                            </div>
                          </div>
                          {expandedOrderId === order.id ? (
                            /* Expanded Order Summary */
                            <div className="border-t pt-3 sm:pt-4">
                              {/* Order Summary Header */}
                              <h4 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Order Summary</h4>
                              
                              {/* Item Details Section */}
                              <div className="mb-4 sm:mb-6">
                                <h5 className="font-medium mb-2 sm:mb-3 text-sm sm:text-md">Item Details</h5>
                                <div className="space-y-2 sm:space-y-3">
                                  {order.items?.map((item: any) => (
                                    <div key={item.id} className="flex justify-between bg-neutral-50 p-2 sm:p-3 rounded-md">
                                      <div className="flex gap-2 sm:gap-3">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded overflow-hidden flex-shrink-0">
                                          <img
                                            src={item.meal?.imageUrl || "https://via.placeholder.com/64?text=Meal"}
                                            alt={item.meal?.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm sm:text-base">{item.meal?.name}</p>
                                          <p className="text-xs sm:text-sm text-gray-600">Qty: {item.quantity}</p>
                                          {item.curryOptionName && (
                                            <p className="text-xs sm:text-sm text-gray-600">
                                              Curry: {item.curryOptionName}
                                              {item.curryOptionPrice > 0 && ` (+${formatPrice(item.curryOptionPrice)})`}
                                            </p>
                                          )}
                                          {item.notes && (
                                            <p className="text-xs sm:text-sm text-gray-600">Notes: {item.notes}</p>
                                          )}
                                        </div>
                                      </div>
                                      <p className="font-medium text-xs sm:text-sm self-center">
                                        {formatPrice(
                                          (item.price || (item.meal?.price + (item.curryOptionPrice || 0))) * item.quantity
                                        )}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Bill Details Section */}
                              <div className="mb-4 sm:mb-6 bg-gray-50 p-3 sm:p-4 rounded-md">
                                <h5 className="font-medium mb-2 sm:mb-3 text-sm sm:text-md">Bill Details</h5>
                                <div className="space-y-1.5 sm:space-y-2">
                                  <div className="flex justify-between text-xs sm:text-sm">
                                    <span>Item Total</span>
                                    <span>{formatPrice(order.totalPrice)}</span>
                                  </div>
                                  {order.deliveryFee > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span>Delivery Fee</span>
                                      <span>{formatPrice(order.deliveryFee)}</span>
                                    </div>
                                  )}
                                  {order.discount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                      <span>Discount</span>
                                      <span>-{formatPrice(order.discount)}</span>
                                    </div>
                                  )}
                                  <div className="border-t border-gray-200 mt-2 pt-2"></div>
                                  <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span>{formatPrice(order.finalAmount || order.totalPrice)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Order Details Section */}
                              <div className="mb-6">
                                <h5 className="font-medium mb-3 text-md">Order Details</h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-start gap-2">
                                    <span className="font-medium w-32">Payment Method:</span>
                                    <span className="capitalize">{order.paymentMethod || 'Online payment'}</span>
                                  </div>
                                  {order.razorpayOrderId && (
                                    <div className="flex items-start gap-2">
                                      <span className="font-medium w-32">Transaction ID:</span>
                                      <span className="text-xs font-mono bg-gray-100 p-1 rounded">{order.razorpayOrderId}</span>
                                    </div>
                                  )}
                                  {order.deliveryAddress && (
                                    <div className="flex items-start gap-2">
                                      <span className="font-medium w-32">Delivery Address:</span>
                                      <span>{order.deliveryAddress}</span>
                                    </div>
                                  )}
                                  {order.deliveryTime && (
                                    <div className="flex items-start gap-2">
                                      <span className="font-medium w-32">Delivery Time:</span>
                                      <span>{format(new Date(order.deliveryTime), "MMMM d, yyyy 'at' h:mm a")}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Support Section */}
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <h5 className="font-medium mb-2">Need Help?</h5>
                                <p className="text-sm mb-3">If you have any questions about your order, please contact our support team.</p>
                                <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                                  Contact Support
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* Collapsed Order Summary (just show a few items) */
                            <div className="border-t pt-4">
                              <h4 className="font-medium mb-2">Order Items</h4>
                              <div className="space-y-2">
                                {order.items?.slice(0, 2).map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="flex justify-between items-center bg-neutral-light p-2 rounded"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-10 h-10 rounded overflow-hidden">
                                        <img
                                          src={item.meal?.imageUrl || "https://via.placeholder.com/40?text=Meal"}
                                          alt={item.meal?.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div>
                                        <p className="font-medium">
                                          {item.meal?.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          Qty: {item.quantity}
                                          {item.curryOptionName && ` • ${item.curryOptionName}`}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="font-medium">
                                      {formatPrice(
                                        (item.price || (item.meal?.price + (item.curryOptionPrice || 0))) * item.quantity
                                      )}
                                    </p>
                                  </div>
                                ))}
                                
                                {order.items?.length > 2 && (
                                  <p className="text-sm text-gray-500 mt-2">
                                    +{order.items.length - 2} more items
                                  </p>
                                )}
                              </div>
                              
                              {order.deliveryTime && (
                                <div className="mt-4 text-sm text-gray-600">
                                  <p>
                                    Delivery Time:{" "}
                                    {format(
                                      new Date(order.deliveryTime),
                                      "MMMM d, yyyy 'at' h:mm a",
                                    )}
                                  </p>
                                  <p>Delivery Address: {order.deliveryAddress}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
