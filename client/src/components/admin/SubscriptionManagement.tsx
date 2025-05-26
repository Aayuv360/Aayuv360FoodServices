import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, Calendar, DollarSign } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function SubscriptionManagement() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Query to fetch subscriptions
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

  // Mutation for updating subscription status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/subscriptions/${id}/status`, { status });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update subscription status");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      toast({
        title: "Success",
        description: "Subscription status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription status",
        variant: "destructive",
      });
    },
  });

  // Mutation for extending subscription
  const extendSubscriptionMutation = useMutation({
    mutationFn: async ({ id, days }: { id: number; days: number }) => {
      const res = await apiRequest("PATCH", `/api/admin/subscriptions/${id}/extend`, { days });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to extend subscription");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      toast({
        title: "Success",
        description: "Subscription extended successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to extend subscription",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  const getSubscriptionStatus = (subscription: any) => {
    const now = new Date();
    const startDate = new Date(subscription.startDate);
    const endDate = subscription.endDate ? new Date(subscription.endDate) : 
      new Date(startDate.getTime() + (subscription.duration || 30) * 24 * 60 * 60 * 1000);

    if (subscription.status === 'cancelled') return 'cancelled';
    if (now < startDate) return 'inactive';
    if (now > endDate) return 'completed';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSubscriptions = subscriptions?.filter((subscription: any) => {
    if (statusFilter === "all") return true;
    return getSubscriptionStatus(subscription) === statusFilter;
  }) || [];

  const openSubscriptionDetails = (subscription: any) => {
    setSelectedSubscription(subscription);
    setIsDetailDialogOpen(true);
  };

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

      {/* Summary Cards */}
      {subscriptions && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">Active</Badge>
                <span className="text-2xl font-bold">
                  {subscriptions.filter((s: any) => getSubscriptionStatus(s) === 'active').length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                <span className="text-2xl font-bold">
                  {subscriptions.filter((s: any) => getSubscriptionStatus(s) === 'inactive').length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
                <span className="text-2xl font-bold">
                  {subscriptions.filter((s: any) => getSubscriptionStatus(s) === 'completed').length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-lg font-semibold">
                  {formatPrice(subscriptions.reduce((total: number, s: any) => total + s.price, 0))}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscriptions Table */}
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription: any) => {
                  const status = getSubscriptionStatus(subscription);
                  const endDate = subscription.endDate ? new Date(subscription.endDate) : 
                    new Date(new Date(subscription.startDate).getTime() + (subscription.duration || 30) * 24 * 60 * 60 * 1000);

                  return (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">{subscription.id}</TableCell>
                      <TableCell>{subscription.userName}</TableCell>
                      <TableCell>{subscription.plan}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(status)}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(subscription.startDate)}</TableCell>
                      <TableCell>{formatDate(endDate)}</TableCell>
                      <TableCell>{formatPrice(subscription.price)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Select
                            defaultValue={status}
                            onValueChange={(value) => {
                              updateStatusMutation.mutate({ id: subscription.id, status: value });
                            }}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => extendSubscriptionMutation.mutate({ id: subscription.id, days: 30 })}
                            disabled={extendSubscriptionMutation.isPending}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Extend
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSubscriptionDetails(subscription)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
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

      {/* Subscription Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              Detailed information about subscription #{selectedSubscription?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Customer</label>
                  <p className="text-sm text-muted-foreground">{selectedSubscription.userName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Plan</label>
                  <p className="text-sm text-muted-foreground">{selectedSubscription.plan}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(getSubscriptionStatus(selectedSubscription))}>
                    {getSubscriptionStatus(selectedSubscription)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Price</label>
                  <p className="text-sm text-muted-foreground">{formatPrice(selectedSubscription.price)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedSubscription.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <p className="text-sm text-muted-foreground">{selectedSubscription.duration || 30} days</p>
                </div>
              </div>
              
              {selectedSubscription.preferences && (
                <div>
                  <label className="text-sm font-medium">Preferences</label>
                  <p className="text-sm text-muted-foreground">{JSON.stringify(selectedSubscription.preferences, null, 2)}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}