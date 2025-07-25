import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Truck,
  Calendar,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { SubscriptionManagement } from "@/components/OrderMagament/SubscriptionManagement";
import { useToast } from "@/hooks/use-toast";

export default function OrderManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cart-orders");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrderIds, setExpandedOrderIds] = useState<number[]>([]);

  // Fetch cart orders
  const { data: cartOrders, isLoading: isLoadingCartOrders } = useQuery({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/orders`);
      if (!response.ok) {
        throw new Error("Failed to fetch orders data");
      }
      return response.json();
    },
    enabled: !!user && (user.role === "admin" || user.role === "manager"),
  });

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await apiRequest("PATCH", `/api/admin/orders/${orderId}/status`, {
        status,
      });
      toast({
        title: "Status updated",
        description: `Order #${orderId} status updated to ${status}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  // Filtered orders based on status
  const filteredOrders =
    statusFilter === "all"
      ? cartOrders
      : cartOrders?.filter((order: any) => order.status === statusFilter);

  if (isLoadingCartOrders) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
        <p className="text-muted-foreground text-center">
          The order management dashboard is only available to managers and
          administrators.
        </p>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateInput: string | Date) => {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Format status for display with badge
  const statusBadge = (status: string) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      in_transit: "bg-purple-100 text-purple-800",
      out_for_delivery: "bg-indigo-100 text-indigo-800",
      nearby: "bg-cyan-100 text-cyan-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const displayText =
      status === "in_transit"
        ? "In Transit"
        : status === "out_for_delivery"
          ? "Out for Delivery"
          : status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles]}>
        {displayText}
      </Badge>
    );
  };

  // Toggle order details
  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  // Calculate item price from meal and curry option
  const calculateItemPrice = (item: any) => {
    const basePrice = item.meal?.price || 0;
    const curryPrice = item.curryOptionPrice || 0;
    const quantity = item.quantity || 1;
    return (basePrice + curryPrice) * quantity;
  };

  // Format currency
  const formatPrice = (price: number | string | undefined) => {
    if (price === undefined || price === null || isNaN(Number(price))) {
      return "₹0";
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">
            Track and manage customer orders and subscriptions
          </p>
        </div>
      </div>

      <Tabs defaultValue="cart-orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="cart-orders">Cart Orders</TabsTrigger>
          <TabsTrigger value="subscription-management">
            Subscription Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cart-orders" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">All Orders</h2>
            <div className="flex items-center gap-2">
              <Select
                defaultValue={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">
                    Out for Delivery
                  </SelectItem>
                  <SelectItem value="nearby">Nearby</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders && filteredOrders.length > 0 ? (
                    filteredOrders.map((order: any) => (
                      <>
                        <TableRow
                          key={order.id}
                          className={
                            expandedOrderIds.includes(order.id)
                              ? "border-b-0"
                              : ""
                          }
                          onClick={() => toggleOrderDetails(order.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <TableCell className="font-medium">
                            #{order.id}
                          </TableCell>
                          <TableCell>
                            {order.userName || "Unknown User"}
                          </TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>{formatPrice(order.totalPrice)}</TableCell>
                          <TableCell>{statusBadge(order.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Select
                                defaultValue={order.status}
                                onValueChange={(value) =>
                                  updateOrderStatus(order.id, value)
                                }
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue placeholder="Update status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">
                                    Pending
                                  </SelectItem>
                                  <SelectItem value="confirmed">
                                    Confirmed
                                  </SelectItem>
                                  <SelectItem value="preparing">
                                    Preparing
                                  </SelectItem>
                                  <SelectItem value="in_transit">
                                    In Transit
                                  </SelectItem>
                                  <SelectItem value="out_for_delivery">
                                    Out for Delivery
                                  </SelectItem>
                                  <SelectItem value="nearby">Nearby</SelectItem>
                                  <SelectItem value="delivered">
                                    Delivered
                                  </SelectItem>
                                  <SelectItem value="cancelled">
                                    Cancelled
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleOrderDetails(order.id);
                                }}
                                className="p-0 w-8 h-8"
                              >
                                {expandedOrderIds.includes(order.id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedOrderIds.includes(order.id) && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-muted/20 p-4">
                              <div className="space-y-4">
                                {/* Order details section */}
                                <div>
                                  <h3 className="font-medium text-base mb-2">
                                    Order Details
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="font-medium">
                                        Payment Method:
                                      </span>{" "}
                                      {order.paymentMethod || "Not specified"}
                                    </div>
                                    {order.razorpayOrderId && (
                                      <div>
                                        <span className="font-medium">
                                          Transaction ID:
                                        </span>{" "}
                                        <span className="font-mono text-xs bg-muted p-1 rounded">
                                          {order.razorpayOrderId}
                                        </span>
                                      </div>
                                    )}
                                    {order.deliveryAddress && (
                                      <div className="col-span-2">
                                        <span className="font-medium">
                                          Delivery Address:
                                        </span>{" "}
                                        {order.deliveryAddress}
                                      </div>
                                    )}
                                    {order.deliveryTime && (
                                      <div>
                                        <span className="font-medium">
                                          Delivery Time:
                                        </span>{" "}
                                        {formatDate(order.deliveryTime)}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Order items section */}
                                {order.items && order.items.length > 0 && (
                                  <div>
                                    <h3 className="font-medium text-base mb-2">
                                      Order Items
                                    </h3>
                                    <div className="overflow-hidden rounded-md border">
                                      <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                          <tr>
                                            <th className="px-4 py-2 text-left font-medium">
                                              Item
                                            </th>
                                            <th className="px-4 py-2 text-center font-medium">
                                              Quantity
                                            </th>
                                            <th className="px-4 py-2 text-right font-medium">
                                              Price
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {order.items.map(
                                            (item: any, index: number) => (
                                              <tr
                                                key={index}
                                                className="border-t"
                                              >
                                                <td className="px-4 py-2">
                                                  <div>
                                                    <div className="font-medium">
                                                      {item.meal?.name ||
                                                        (item.mealId
                                                          ? `Meal #${item.mealId}`
                                                          : "Unknown Meal")}
                                                    </div>
                                                    {item.curryOptionName && (
                                                      <div className="text-xs text-muted-foreground">
                                                        Curry:{" "}
                                                        {item.curryOptionName}
                                                      </div>
                                                    )}
                                                    {item.notes && (
                                                      <div className="text-xs text-muted-foreground">
                                                        Note: {item.notes}
                                                      </div>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                  {item.quantity}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                  {formatPrice(
                                                    calculateItemPrice(item),
                                                  )}
                                                </td>
                                              </tr>
                                            ),
                                          )}
                                          <tr className="border-t bg-muted/30">
                                            <td
                                              colSpan={2}
                                              className="px-4 py-2 text-right font-medium"
                                            >
                                              Total:
                                            </td>
                                            <td className="px-4 py-2 text-right font-medium">
                                              {formatPrice(order.totalPrice)}
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-muted-foreground"
                      >
                        {statusFilter === "all"
                          ? "No orders found"
                          : `No orders with status '${statusFilter}' found`}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription-management" className="space-y-6">
          <SubscriptionManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
