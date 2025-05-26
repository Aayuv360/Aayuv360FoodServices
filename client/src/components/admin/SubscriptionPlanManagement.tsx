import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, X, Leaf, Egg, Utensils } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SubscriptionPlan {
  id: string;
  name: string;
  dietaryPreference: "veg" | "veg_with_egg" | "non_veg";
  planType: "basic" | "premium" | "family";
  price: number;
  duration: number;
  description: string;
  features: string[];
  meals_per_day: number;
  customization_allowed: boolean;
}

export function SubscriptionPlanManagement() {
  const { toast } = useToast();
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Query to fetch subscription plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription-plans");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch subscription plans");
      }
      return await res.json();
    },
  });

  // Mutation for updating subscription plan
  const updatePlanMutation = useMutation({
    mutationFn: async (planData: SubscriptionPlan) => {
      const res = await apiRequest("PUT", `/api/admin/subscription-plans/${planData.id}`, planData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update subscription plan");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-plans"] });
      setIsEditDialogOpen(false);
      setEditingPlan(null);
      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription plan",
        variant: "destructive",
      });
    },
  });

  const getDietaryIcon = (preference: string) => {
    switch (preference) {
      case "veg": return <Leaf className="h-4 w-4 text-green-600" />;
      case "veg_with_egg": return <Egg className="h-4 w-4 text-orange-600" />;
      case "non_veg": return <Utensils className="h-4 w-4 text-red-600" />;
      default: return <Leaf className="h-4 w-4" />;
    }
  };

  const getDietaryLabel = (preference: string) => {
    switch (preference) {
      case "veg": return "Vegetarian";
      case "veg_with_egg": return "Veg with Egg";
      case "non_veg": return "Non-Vegetarian";
      default: return preference;
    }
  };

  const getPlanTypeColor = (planType: string) => {
    switch (planType) {
      case "basic": return "bg-blue-100 text-blue-800";
      case "premium": return "bg-purple-100 text-purple-800";
      case "family": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  const openEditDialog = (plan: any) => {
    setEditingPlan({
      id: plan.id,
      name: plan.name,
      dietaryPreference: plan.dietaryPreference,
      planType: plan.planType,
      price: plan.price,
      duration: plan.duration,
      description: plan.description,
      features: plan.features || [],
      meals_per_day: plan.meals_per_day || 2,
      customization_allowed: plan.customization_allowed || false,
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    if (editingPlan) {
      updatePlanMutation.mutate(editingPlan);
    }
  };

  const groupedPlans = plans?.reduce((acc: any, plan: any) => {
    if (!acc[plan.dietaryPreference]) {
      acc[plan.dietaryPreference] = [];
    }
    acc[plan.dietaryPreference].push(plan);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Subscription Plan Management</h2>
        <p className="text-muted-foreground">Manage plans by dietary preferences</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading subscription plans...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Vegetarian Plans */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="h-5 w-5 text-green-600" />
              <h3 className="text-xl font-semibold text-green-600">Vegetarian Plans</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {groupedPlans.veg?.map((plan: any) => (
                <Card key={plan.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <Badge className={getPlanTypeColor(plan.planType)} variant="secondary">
                          {plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">{formatPrice(plan.price)}</div>
                      <p className="text-sm text-muted-foreground">{plan.duration} days</p>
                      <p className="text-sm">{plan.description}</p>
                      <div className="text-xs text-muted-foreground">
                        {plan.meals_per_day} meals/day • {plan.customization_allowed ? 'Customizable' : 'Fixed menu'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Veg with Egg Plans */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Egg className="h-5 w-5 text-orange-600" />
              <h3 className="text-xl font-semibold text-orange-600">Vegetarian with Egg Plans</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {groupedPlans.veg_with_egg?.map((plan: any) => (
                <Card key={plan.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <Badge className={getPlanTypeColor(plan.planType)} variant="secondary">
                          {plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-orange-600">{formatPrice(plan.price)}</div>
                      <p className="text-sm text-muted-foreground">{plan.duration} days</p>
                      <p className="text-sm">{plan.description}</p>
                      <div className="text-xs text-muted-foreground">
                        {plan.meals_per_day} meals/day • {plan.customization_allowed ? 'Customizable' : 'Fixed menu'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Non-Vegetarian Plans */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Utensils className="h-5 w-5 text-red-600" />
              <h3 className="text-xl font-semibold text-red-600">Non-Vegetarian Plans</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {groupedPlans.non_veg?.map((plan: any) => (
                <Card key={plan.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <Badge className={getPlanTypeColor(plan.planType)} variant="secondary">
                          {plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-red-600">{formatPrice(plan.price)}</div>
                      <p className="text-sm text-muted-foreground">{plan.duration} days</p>
                      <p className="text-sm">{plan.description}</p>
                      <div className="text-xs text-muted-foreground">
                        {plan.meals_per_day} meals/day • {plan.customization_allowed ? 'Customizable' : 'Fixed menu'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Update the subscription plan details below.
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={editingPlan.name}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editingPlan.price}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={editingPlan.duration}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, duration: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meals_per_day">Meals per Day</Label>
                  <Input
                    id="meals_per_day"
                    type="number"
                    value={editingPlan.meals_per_day}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, meals_per_day: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingPlan.description}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, description: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="customization_allowed"
                  checked={editingPlan.customization_allowed}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, customization_allowed: e.target.checked })
                  }
                />
                <Label htmlFor="customization_allowed">Allow customization</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updatePlanMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updatePlanMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}