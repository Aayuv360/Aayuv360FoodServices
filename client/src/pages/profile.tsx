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
    <div className="min-h-screen bg-neutral-light py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center space-y-4 py-6">
                  <UserCircle className="h-20 w-20 text-primary" />
                  <div className="text-center">
                    <h2 className="text-xl font-bold">{user.name}</h2>
                    <p className="text-gray-500 text-sm">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-2 mt-6">
                  <Button
                    variant={currentTab === "profile" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setCurrentTab("profile");
                      navigate("/profile", { replace: true });
                    }}
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  <Button
                    variant={
                      currentTab === "subscriptions" ? "default" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => {
                      setCurrentTab("subscriptions"); 
                      navigate("/profile?tab=subscriptions", { replace: true });
                    }}
                  >
                    <ClockIcon className="mr-2 h-4 w-4" />
                    Subscriptions
                  </Button>
                  <Button
                    variant={currentTab === "orders" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setCurrentTab("orders");
                      navigate("/profile?tab=orders", { replace: true });
                    }}
                  >
                    <History className="mr-2 h-4 w-4" />
                    Order History
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            {currentTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>
                    Manage your account information and delivery address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Address</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="bg-primary hover:bg-primary/90"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                <CardHeader>
                  <CardTitle>Your Subscriptions</CardTitle>
                  <CardDescription>
                    Manage your active meal plans and subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSubscriptions ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !subscriptions || subscriptions.length === 0 ? (
                    <div className="text-center py-8 bg-neutral-light rounded-lg">
                      <h3 className="text-lg font-medium mb-2">
                        No active subscriptions
                      </h3>
                      <p className="text-gray-600 mb-4">
                        You don't have any active subscriptions yet.
                      </p>
                      <Button
                        asChild
                        className="bg-primary hover:bg-primary/90"
                      >
                        <a href="/subscription">Browse Plans</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {subscriptions.map((subscription: any) => (
                        <div
                          key={subscription.id}
                          className="border rounded-lg p-4 flex flex-col md:flex-row justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold capitalize">
                                {subscription.plan} Plan
                              </h3>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${getSubscriptionStatusClass(
                                  subscription.isActive,
                                )}`}
                              >
                                {subscription.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-2">
                              {subscription.mealsPerMonth} meals per month
                            </p>
                            <div className="text-sm text-gray-500">
                              <p>
                                Started:{" "}
                                {format(
                                  new Date(subscription.startDate),
                                  "MMMM d, yyyy",
                                )}
                              </p>
                              {subscription.endDate && (
                                <p>
                                  Ends:{" "}
                                  {format(
                                    new Date(subscription.endDate),
                                    "MMMM d, yyyy",
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col justify-center items-end">
                            <p className="text-xl font-bold text-primary mb-2">
                              {formatPrice(subscription.price)}
                              <span className="text-sm text-gray-500">
                                /month
                              </span>
                            </p>
                            <Button
                              variant="outline"
                              className="border-primary text-primary hover:bg-primary hover:text-white"
                            >
                              Manage
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentTab === "orders" && (
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>
                    View your past orders and delivery status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingOrders ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !orders || orders.length === 0 ? (
                    <div className="text-center py-8 bg-neutral-light rounded-lg">
                      <h3 className="text-lg font-medium mb-2">
                        No orders yet
                      </h3>
                      <p className="text-gray-600 mb-4">
                        You haven't placed any orders yet.
                      </p>
                      <Button
                        asChild
                        className="bg-primary hover:bg-primary/90"
                      >
                        <a href="/menu">Browse Menu</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order: any) => (
                        <div 
                          key={order.id} 
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div 
                            className="flex flex-col md:flex-row justify-between mb-4 gap-2 cursor-pointer"
                            onClick={() => toggleOrderDetails(order.id)}
                          >
                            <div>
                              <p className="text-sm text-gray-500">
                                Order #{order.id}
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(
                                  new Date(order.createdAt),
                                  "MMMM d, yyyy",
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full capitalize ${getOrderStatusClass(
                                  order.status,
                                )}`}
                              >
                                {order.status}
                              </span>
                              <p className="font-bold text-primary">
                                {formatPrice(order.totalPrice)}
                              </p>
                              <ChevronRight 
                                className={`h-5 w-5 text-gray-400 transition-transform ${expandedOrderId === order.id ? 'rotate-90' : ''}`} 
                              />
                            </div>
                          </div>
                          {expandedOrderId === order.id ? (
                            /* Expanded Order Summary */
                            <div className="border-t pt-4">
                              {/* Order Summary Header */}
                              <h4 className="text-lg font-medium mb-4">Order Summary</h4>
                              
                              {/* Item Details Section */}
                              <div className="mb-6">
                                <h5 className="font-medium mb-3 text-md">Item Details</h5>
                                <div className="space-y-3">
                                  {order.items?.map((item: any) => (
                                    <div key={item.id} className="flex justify-between bg-neutral-50 p-3 rounded-md">
                                      <div className="flex gap-3">
                                        <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                          <img
                                            src={item.meal?.imageUrl || "https://via.placeholder.com/64?text=Meal"}
                                            alt={item.meal?.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div>
                                          <p className="font-medium">{item.meal?.name}</p>
                                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                          {item.curryOptionName && (
                                            <p className="text-sm text-gray-600">
                                              Curry: {item.curryOptionName}
                                              {item.curryOptionPrice > 0 && ` (+${formatPrice(item.curryOptionPrice)})`}
                                            </p>
                                          )}
                                          {item.notes && (
                                            <p className="text-sm text-gray-600">Notes: {item.notes}</p>
                                          )}
                                        </div>
                                      </div>
                                      <p className="font-medium">
                                        {formatPrice(
                                          (item.price || (item.meal?.price + (item.curryOptionPrice || 0))) * item.quantity
                                        )}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Bill Details Section */}
                              <div className="mb-6 bg-gray-50 p-4 rounded-md">
                                <h5 className="font-medium mb-3 text-md">Bill Details</h5>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
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
