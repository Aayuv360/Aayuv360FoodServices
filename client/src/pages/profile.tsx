import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Loader2,
  UserCircle,
  ClockIcon,
  History,
  LogOut,
  ChevronRight,
  Truck,
  Wallet,
  Plus,
  AlertTriangle,
} from "lucide-react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [showAddMoneyDialog, setShowAddMoneyDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [walletAmount, setWalletAmount] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get("tab") || "profile";
  const [currentTab, setCurrentTab] = useState(initialTab);

  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");
    setCurrentTab(tabParam || "profile");
  }, [location.search]);

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
      enabled: !!user,
    });

  // Wallet balance query
  const { data: walletData, isLoading: isLoadingWallet } = useQuery({
    queryKey: ["/api/profile/wallet"],
    enabled: !!user && currentTab === "profile",
  });

  // Deletion status query
  const { data: deletionStatus } = useQuery({
    queryKey: ["/api/profile/deletion-status"],
    enabled: !!user && currentTab === "profile",
  });

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

  // Add money to wallet mutation
  const addMoneyMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/profile/wallet/add", { amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile/wallet"] });
      toast({
        title: "Money added successfully",
        description: "Your wallet has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add money",
        description: error.message || "There was an error adding money to your wallet",
        variant: "destructive",
      });
    },
  });

  // Delete account immediately mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await apiRequest("POST", "/api/profile/delete-account", { reason });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account deleted successfully",
        description: "Your account and all data have been permanently deleted",
      });
      // Automatically logout after successful deletion
      setTimeout(() => {
        logout();
        navigate("/");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete account",
        description: error.message || "There was an error deleting your account",
        variant: "destructive",
      });
    },
  });

  const handleAddMoney = () => {
    setShowAddMoneyDialog(true);
  };

  const confirmAddMoney = () => {
    const amount = Number(walletAmount);
    if (amount > 0) {
      addMoneyMutation.mutate(amount);
      setShowAddMoneyDialog(false);
      setWalletAmount("");
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteAccount = () => {
    if (deleteReason.trim()) {
      deleteAccountMutation.mutate(deleteReason);
      setShowDeleteDialog(false);
      setDeleteReason("");
    }
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
  function getSubscriptionStatusClass(status: string) {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-200 text-gray-600";
    }
  }
  function capitalizeFirstLetter(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  const determineAction = (status: string): string => {
    let action = "NONE / DEFAULT";

    if (status === "active" || status === "inactive") {
      action = "Manage";
    } else if (status === "completed") {
      action = "Renew";
    }

    return action;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-3 sm:py-6">
      <div className="container mx-auto max-w-6xl px-5 py-6">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          <div className="hidden md:block w-full md:w-64 space-y-3 sm:space-y-4">
            <Card className="bg-white border rounded-xl shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col items-center space-y-3 sm:space-y-4 py-4 sm:py-6">
                  <UserCircle className="h-16 w-16 sm:h-20 sm:w-20 text-primary" />
                  <div className="text-center">
                    <h2 className="text-lg sm:text-xl font-bold">
                      {user.name}
                    </h2>
                    <p className="text-gray-500 text-xs sm:text-sm">
                      {user.email}
                    </p>
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
              <div className="w-full">
                <div className="mx-auto space-y-5">
                  <div>
                    <h1 className="text-2xl font-semibold mb-2">
                      Your Profile
                    </h1>
                    <p className="text-gray-600 mb-6">
                      Manage your account information address and wallet
                    </p>
                  </div>
                  <Card className="bg-white border rounded-xl shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">
                          Wallet Balance
                        </span>
                        <div className="flex items-center space-x-2">
                          <Wallet className="w-5 h-5 text-green-500" />
                          <span className="text-xl font-bold text-green-600">
                            {isLoadingWallet ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              `₹${(walletData?.balance || 0).toFixed(2)}`
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button
                          onClick={handleAddMoney}
                          disabled={addMoneyMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {addMoneyMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          Add Money
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border rounded-xl shadow">
                    <CardContent className="p-6">
                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(onSubmit)}
                          className="space-y-1"
                        >
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs sm:text-sm">
                                  Full Name
                                </FormLabel>
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
                                <FormLabel className="text-xs sm:text-sm">
                                  Email
                                </FormLabel>
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
                                <FormLabel className="text-xs sm:text-sm">
                                  Phone Number
                                </FormLabel>
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
                                <FormLabel className="text-xs sm:text-sm">
                                  Address
                                </FormLabel>
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

                          <div>
                            <Button
                              type="submit"
                              className="bg-primary hover:bg-primary/90 text-xs sm:text-sm mt-4"
                              disabled={updateProfileMutation.isPending}
                            >
                              {" "}
                              {updateProfileMutation.isPending ? (
                                <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : null}{" "}
                              {updateProfileMutation.isPending
                                ? "Saving..."
                                : "Save Changes"}{" "}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border rounded-xl shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-lg font-medium text-red-600">
                          Danger Zone
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Warning:</strong> This will permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAccount}
                        disabled={deleteAccountMutation.isPending}
                      >
                        {deleteAccountMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Delete Account Permanently
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {currentTab === "subscriptions" && (
              <Card>
                <div>
                  <h1 className="text-2xl font-semibold mb-2 sm:mb-3">
                    Your Subscription
                  </h1>
                  <p className="text-gray-600 mb-4 sm:mb-6">
                    Manage your active meal plan and subscription
                  </p>

                  <CardContent className="bg-white border rounded-xl shadow p-4 sm:p-4">
                    {isLoadingSubscriptions ? (
                      <div className="flex justify-center py-6 sm:py-8">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                      </div>
                    ) : !subscriptions || subscriptions.length === 0 ? (
                      <div className="text-center py-6 sm:py-8 bg-neutral-light rounded-lg px-4">
                        <h3 className="text-base sm:text-lg font-medium mb-1.5 sm:mb-2">
                          No active subscription
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                          You don't have any active subscription yet.
                        </p>
                        <Button
                          asChild
                          className="bg-primary hover:bg-primary/90 text-xs sm:text-sm h-auto py-1.5 sm:py-2"
                        >
                          <a href="/subscription">Browse Plans</a>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6 sm:space-y-8">
                        {subscriptions.map((subscription: any) => (
                          <div key={subscription.id} className="space-y-4">
                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                  <h3 className="text-base sm:text-lg font-bold capitalize">
                                    {subscription.plan} Plan
                                  </h3>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${getSubscriptionStatusClass(subscription.status)}`}
                                  >
                                    {capitalizeFirstLetter(subscription.status)}
                                  </span>
                                </div>

                                <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    {subscription.mealsPerMonth} meals per month
                                  </p>
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

                              <div className="flex flex-col gap-3 items-start md:items-end">
                                <p className="text-base sm:text-xl font-bold text-primary">
                                  {formatPrice(subscription.price)}
                                  <span className="text-xs sm:text-sm text-gray-500 ml-1">
                                    /month
                                  </span>
                                </p>
                                <Button
                                  variant="default"
                                  onClick={() => navigate(`/subscription`)}
                                  className="w-full md:w-auto"
                                >
                                  {determineAction(subscription.status)}
                                </Button>
                              </div>
                            </div>

                            {/* Subscription Details + Plan Benefits */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                              {/* Subscription Details */}
                              <div>
                                <h4 className="font-medium mb-3">
                                  Subscription Details
                                </h4>
                                <div className="bg-neutral-50 p-4 rounded-md space-y-3 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Subscription ID:
                                    </span>
                                    <span className="font-medium break-all">
                                      {subscription.id}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Status:
                                    </span>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full ${getSubscriptionStatusClass(subscription.status)}`}
                                    >
                                      {capitalizeFirstLetter(
                                        subscription.status,
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Plan Type:
                                    </span>
                                    <span className="font-medium capitalize">
                                      {subscription.plan}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Next Billing:
                                    </span>
                                    <span className="font-medium">
                                      {format(
                                        new Date(
                                          subscription.nextBillingDate ||
                                            new Date(
                                              subscription.startDate,
                                            ).setMonth(
                                              new Date(
                                                subscription.startDate,
                                              ).getMonth() + 1,
                                            ),
                                        ),
                                        "MMMM d, yyyy",
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Payment Method:
                                    </span>
                                    <span className="font-medium capitalize">
                                      {subscription.paymentMethod ||
                                        "Credit Card"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Plan Benefits */}
                              <div>
                                <h4 className="font-medium mb-3">
                                  Plan Benefits
                                </h4>
                                <div className="bg-neutral-50 p-4 rounded-md space-y-3 text-sm">
                                  {[
                                    `${subscription.mealsPerMonth} meals per month`,
                                    "Free delivery on all orders",
                                    "Customize meal plan options",
                                    "Priority customer support",
                                  ].map((benefit, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="text-green-600"
                                        >
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      </span>
                                      <span>{benefit}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </div>
              </Card>
            )}

            {currentTab === "orders" && (
              <Card>
                <CardHeader className="py-4 sm:py-6">
                  <CardTitle className="text-lg sm:text-xl">
                    Order History
                  </CardTitle>
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
                          className="p-3 sm:p-4 hover:shadow-md transition-shadow bg-white border rounded-xl shadow"
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
                                className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform ${expandedOrderId === order.id ? "rotate-90" : ""}`}
                              />
                            </div>
                          </div>
                          {expandedOrderId === order.id ? (
                            /* Expanded Order Summary */
                            <div className="border-t pt-3 sm:pt-4">
                              {/* Order Summary Header */}
                              <h4 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
                                Order Summary
                              </h4>

                              {/* Item Details Section */}
                              <div className="mb-4 sm:mb-6">
                                <h5 className="font-medium mb-2 sm:mb-3 text-sm sm:text-md">
                                  Item Details
                                </h5>
                                <div className="space-y-2 sm:space-y-3">
                                  {order.items?.map((item: any) => (
                                    <div
                                      key={item.id}
                                      className="flex justify-between bg-neutral-50 p-2 sm:p-3 rounded-md"
                                    >
                                      <div className="flex gap-2 sm:gap-3">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded overflow-hidden flex-shrink-0">
                                          <img
                                            src={
                                              item.meal?.imageUrl ||
                                              "https://via.placeholder.com/64?text=Meal"
                                            }
                                            alt={item.meal?.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm sm:text-base">
                                            {item.meal?.name}
                                          </p>
                                          <p className="text-xs sm:text-sm text-gray-600">
                                            Qty: {item.quantity}
                                          </p>
                                          {item.curryOptionName && (
                                            <p className="text-xs sm:text-sm text-gray-600">
                                              Curry: {item.curryOptionName}
                                              {item.curryOptionPrice > 0 &&
                                                ` (+${formatPrice(item.curryOptionPrice)})`}
                                            </p>
                                          )}
                                          {item.notes && (
                                            <p className="text-xs sm:text-sm text-gray-600">
                                              Notes: {item.notes}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <p className="font-medium text-xs sm:text-sm self-center">
                                        {formatPrice(
                                          (item.price ||
                                            item.meal?.price +
                                              (item.curryOptionPrice || 0)) *
                                            item.quantity,
                                        )}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Bill Details Section */}
                              <div className="mb-4 sm:mb-6 bg-gray-50 p-3 sm:p-4 rounded-md">
                                <h5 className="font-medium mb-2 sm:mb-3 text-sm sm:text-md">
                                  Bill Details
                                </h5>
                                <div className="space-y-1.5 sm:space-y-2">
                                  <div className="flex justify-between text-xs sm:text-sm">
                                    <span>Item Total</span>
                                    <span>{formatPrice(order.totalPrice)}</span>
                                  </div>
                                  {order.deliveryFee > 0 && (
                                    <div className="flex justify-between text-xs sm:text-sm">
                                      <span>Delivery Fee</span>
                                      <span>
                                        {formatPrice(order.deliveryFee)}
                                      </span>
                                    </div>
                                  )}
                                  {order.discount > 0 && (
                                    <div className="flex justify-between text-xs sm:text-sm text-green-600">
                                      <span>Discount</span>
                                      <span>
                                        -{formatPrice(order.discount)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="border-t border-gray-200 mt-2 sm:mt-3 pt-2 sm:pt-3"></div>
                                  <div className="flex justify-between font-bold text-xs sm:text-sm">
                                    <span>Total</span>
                                    <span>
                                      {formatPrice(
                                        order.finalAmount || order.totalPrice,
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Order Details Section */}
                              <div className="mb-4 sm:mb-6">
                                <h5 className="font-medium mb-2 sm:mb-3 text-sm sm:text-md">
                                  Order Details
                                </h5>
                                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                  <div className="flex items-start gap-1.5 sm:gap-2">
                                    <span className="font-medium w-24 sm:w-32">
                                      Payment Method:
                                    </span>
                                    <span className="capitalize">
                                      {order.paymentMethod || "Online payment"}
                                    </span>
                                  </div>
                                  {order.razorpayOrderId && (
                                    <div className="flex items-start gap-1.5 sm:gap-2">
                                      <span className="font-medium w-24 sm:w-32">
                                        Transaction ID:
                                      </span>
                                      <span className="text-[9px] sm:text-xs font-mono bg-gray-100 p-0.5 sm:p-1 rounded truncate max-w-[150px] sm:max-w-none">
                                        {order.razorpayOrderId}
                                      </span>
                                    </div>
                                  )}
                                  {order.deliveryAddress && (
                                    <div className="flex items-start gap-1.5 sm:gap-2">
                                      <span className="font-medium w-24 sm:w-32">
                                        Delivery Address:
                                      </span>
                                      <span className="break-words">
                                        {order.deliveryAddress}
                                      </span>
                                    </div>
                                  )}
                                  {order.deliveryTime && (
                                    <div className="flex items-start gap-1.5 sm:gap-2">
                                      <span className="font-medium w-24 sm:w-32">
                                        Delivery Time:
                                      </span>
                                      <span>
                                        {format(
                                          new Date(order.deliveryTime),
                                          "MMM d, yyyy 'at' h:mm a",
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Support Section */}
                              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                                <h5 className="font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">
                                  Need Help?
                                </h5>
                                <p className="text-xs sm:text-sm mb-2 sm:mb-3">
                                  If you have any questions about your order,
                                  please contact our support team.
                                </p>
                                <Button
                                  variant="outline"
                                  className="text-blue-600 border-blue-600 hover:bg-blue-50 h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-4"
                                >
                                  Contact Support
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* Collapsed Order Summary (just show a few items) */
                            <div className="border-t pt-3 sm:pt-4">
                              <h4 className="font-medium mb-1.5 sm:mb-2 text-sm sm:text-base">
                                Order Items
                              </h4>
                              <div className="space-y-1.5 sm:space-y-2">
                                {order.items?.slice(0, 2).map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="flex justify-between items-center bg-neutral-light p-1.5 sm:p-2 rounded"
                                  >
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded overflow-hidden">
                                        <img
                                          src={
                                            item.meal?.imageUrl ||
                                            "https://via.placeholder.com/40?text=Meal"
                                          }
                                          alt={item.meal?.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div>
                                        <p className="font-medium text-xs sm:text-sm line-clamp-1">
                                          {item.meal?.name}
                                        </p>
                                        <p className="text-[10px] sm:text-sm text-gray-500">
                                          Qty: {item.quantity}
                                          {item.curryOptionName &&
                                            ` • ${item.curryOptionName}`}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="font-medium text-xs sm:text-sm">
                                      {formatPrice(
                                        (item.price ||
                                          item.meal?.price +
                                            (item.curryOptionPrice || 0)) *
                                          item.quantity,
                                      )}
                                    </p>
                                  </div>
                                ))}

                                {order.items?.length > 2 && (
                                  <p className="text-[10px] sm:text-sm text-gray-500 mt-1.5 sm:mt-2">
                                    +{order.items.length - 2} more items
                                  </p>
                                )}
                              </div>

                              {order.deliveryTime && (
                                <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
                                  <p>
                                    Delivery Time:{" "}
                                    {format(
                                      new Date(order.deliveryTime),
                                      "MMM d, yyyy 'at' h:mm a",
                                    )}
                                  </p>
                                  <p className="break-words">
                                    Delivery Address: {order.deliveryAddress}
                                  </p>
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

      {/* Add Money Dialog */}
      <Dialog open={showAddMoneyDialog} onOpenChange={setShowAddMoneyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Money to Wallet</DialogTitle>
            <DialogDescription>
              Enter the amount you want to add to your wallet balance.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              placeholder="Enter amount (₹)"
              value={walletAmount}
              onChange={(e) => setWalletAmount(e.target.value)}
              min="1"
              step="1"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMoneyDialog(false);
                setWalletAmount("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAddMoney}
              disabled={!walletAmount || Number(walletAmount) <= 0 || addMoneyMutation.isPending}
            >
              {addMoneyMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Add Money
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account Permanently</DialogTitle>
            <DialogDescription>
              <strong>Warning:</strong> This will permanently delete your account and all data. This action cannot be undone. Please provide a reason for deletion.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for account deletion..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAccount}
              disabled={!deleteReason.trim() || deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete Account Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
