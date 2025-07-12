import { getCurrentISTDate } from "@/lib/timezone-utils";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Calendar,
  DollarSign,
  Truck,
  Package,
  Clock,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function SubscriptionManagement() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: subscriptions, isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ["/api/admin/subscriptions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/subscriptions");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch subscriptions");
      }
      return await res.json();
    },
  });

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  const getSubscriptionStatus = (subscription: any) => {
    const now = getCurrentISTDate();
    const startDate = new Date(subscription.startDate);
    const endDate = subscription.endDate
      ? new Date(subscription.endDate)
      : new Date(
          startDate.getTime() +
            (subscription.duration || 30) * 24 * 60 * 60 * 1000,
        );

    if (subscription.status === "cancelled") return "cancelled";
    if (now < startDate) return "inactive";
    if (now > endDate) return "completed";
    return "active";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredSubscriptions =
    subscriptions?.filter((subscription: any) => {
      if (statusFilter === "all") return true;
      return getSubscriptionStatus(subscription) === statusFilter;
    }) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Subscription Management</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {subscriptions && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">Active</Badge>
                <span className="text-2xl font-bold">
                  {
                    subscriptions.filter(
                      (s: any) => getSubscriptionStatus(s) === "active",
                    ).length
                  }
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                <span className="text-2xl font-bold">
                  {
                    subscriptions.filter(
                      (s: any) => getSubscriptionStatus(s) === "inactive",
                    ).length
                  }
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
                <span className="text-2xl font-bold">
                  {
                    subscriptions.filter(
                      (s: any) => getSubscriptionStatus(s) === "completed",
                    ).length
                  }
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-lg font-semibold">
                  {formatPrice(
                    subscriptions.reduce(
                      (total: number, s: any) => total + s.price,
                      0,
                    ),
                  )}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSubscriptions ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading subscriptions...</span>
            </div>
          ) : filteredSubscriptions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Today's Delivery</TableHead>
                  <TableHead>Delivery Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription: any) => {
                  const status = getSubscriptionStatus(subscription);
                  const endDate = subscription.endDate
                    ? new Date(subscription.endDate)
                    : new Date(
                        new Date(subscription.startDate).getTime() +
                          (subscription.duration || 30) * 24 * 60 * 60 * 1000,
                      );

                  const today = getCurrentISTDate();

                  const stripTime = (date: Date) =>
                    new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate(),
                    );

                  const start = stripTime(new Date(subscription.startDate));

                  // Difference in calendar days
                  const dayIndex = Math.floor(
                    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
                  );
                  console.log(dayIndex);
                  const todayMenu = subscription.menuItems?.[dayIndex];

                  return (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        {subscription.id}
                      </TableCell>
                      <TableCell>{subscription.userName}</TableCell>
                      <TableCell>{subscription.plan}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(status)}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(subscription.startDate)}
                      </TableCell>
                      <TableCell>{formatDate(endDate)}</TableCell>
                      <TableCell>{formatPrice(subscription.price)}</TableCell>
                      <TableCell>
                        {todayMenu ? (
                          <div className="text-sm">
                            <div className="font-medium">{todayMenu.main}</div>
                            <div className="text-gray-600 text-xs">
                              {todayMenu.sides?.slice(0, 2).join(", ")}
                              {todayMenu.sides?.length > 2 && "..."}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            No delivery today
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {todayMenu ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Scheduled
                            </span>
                          </Badge>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No subscriptions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
