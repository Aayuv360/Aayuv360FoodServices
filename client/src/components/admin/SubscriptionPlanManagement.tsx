import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit, Save, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Plan {
  id: string;
  type: 'basic' | 'premium' | 'family';
  name: string;
  price: number;
  duration: number;
  description: string;
  features: string[];
  dietaryPreference: 'veg' | 'veg_with_egg' | 'nonveg';
}

export function SubscriptionPlanManagement() {
  const { toast } = useToast();
  const [selectedDietary, setSelectedDietary] = useState<'veg' | 'veg_with_egg' | 'nonveg'>('veg');
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Query to fetch subscription plans from MongoDB with cache busting
  const { data: subscriptionPlans, isLoading: isLoadingPlans, refetch } = useQuery({
    queryKey: ["/api/admin/subscription-plans"],
    queryFn: async () => {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const res = await fetch(`/api/admin/subscription-plans?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch subscription plans");
      }
      return await res.json();
    },
    staleTime: 0, // Data is immediately stale
  });

  // Mutation for updating plan using MongoDB
  const updatePlanMutation = useMutation({
    mutationFn: async (planData: Partial<Plan>) => {
      const res = await apiRequest("PUT", `/api/admin/subscription-plans/${planData.id}`, planData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update subscription plan");
      }
      return await res.json();
    },
    onSuccess: () => {
      // Force refetch to get fresh data from MongoDB
      refetch();
      
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

  const dietaryPreferences = [
    { key: 'veg', label: 'Veg', color: 'bg-green-100 text-green-800' },
    { key: 'veg_with_egg', label: 'Veg with Egg', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'nonveg', label: 'Non-Veg', color: 'bg-red-100 text-red-800' }
  ];

  const planTypes = [
    { key: 'basic', label: 'Basic', icon: '🥗' },
    { key: 'premium', label: 'Premium', icon: '⭐' },
    { key: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' }
  ];

  const getPlansForDietary = (dietary: string) => {
    if (!subscriptionPlans) return [];
    return subscriptionPlans.filter((plan: any) => {
      // Map dietary preferences to match API data
      const dietaryMap: Record<string, string> = {
        'veg': 'veg',
        'veg_with_egg': 'veg with egg',
        'nonveg': 'nonveg'
      };
      return plan.dietaryPreference === dietaryMap[dietary] || 
             plan.dietaryPreference === dietary;
    });
  };

  const getPlanByType = (dietary: string, type: string) => {
    const plans = getPlansForDietary(dietary);
    return plans.find((plan: any) => plan.type === type || plan.name.toLowerCase().includes(type));
  };

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  const openEditDialog = (dietary: string, type: string) => {
    const plan = getPlanByType(dietary, type);
    if (plan) {
      setEditingPlan({
        id: plan.id || `${dietary}_${type}`,
        type: type as 'basic' | 'premium' | 'family',
        name: plan.name,
        price: plan.price,
        duration: plan.duration,
        description: plan.description || '',
        features: plan.features || [],
        dietaryPreference: dietary as 'veg' | 'veg_with_egg' | 'nonveg'
      });
      setIsEditDialogOpen(true);
    } else {
      // Create new plan
      setEditingPlan({
        id: `${dietary}_${type}`,
        type: type as 'basic' | 'premium' | 'family',
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Plan`,
        price: 0,
        duration: 30,
        description: '',
        features: [],
        dietaryPreference: dietary as 'veg' | 'veg_with_egg' | 'nonveg'
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleSavePlan = () => {
    if (editingPlan) {
      updatePlanMutation.mutate(editingPlan);
    }
  };

  const updateEditingPlan = (field: keyof Plan, value: any) => {
    if (editingPlan) {
      setEditingPlan({
        ...editingPlan,
        [field]: value
      });
    }
  };

  const addFeature = () => {
    if (editingPlan) {
      setEditingPlan({
        ...editingPlan,
        features: [...editingPlan.features, '']
      });
    }
  };

  const updateFeature = (index: number, value: string) => {
    if (editingPlan) {
      const newFeatures = [...editingPlan.features];
      newFeatures[index] = value;
      setEditingPlan({
        ...editingPlan,
        features: newFeatures
      });
    }
  };

  const removeFeature = (index: number) => {
    if (editingPlan) {
      const newFeatures = editingPlan.features.filter((_, i) => i !== index);
      setEditingPlan({
        ...editingPlan,
        features: newFeatures
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Subscription Plan Management</h2>
      </div>

      {/* Dietary Preference Buttons */}
      <div className="flex gap-4">
        {dietaryPreferences.map((dietary) => (
          <Button
            key={dietary.key}
            variant={selectedDietary === dietary.key ? "default" : "outline"}
            onClick={() => setSelectedDietary(dietary.key as any)}
            className="flex-1"
          >
            <Badge className={dietary.color}>{dietary.label}</Badge>
          </Button>
        ))}
      </div>

      {/* Plans Grid */}
      {isLoadingPlans ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading subscription plans...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planTypes.map((planType) => {
            const plan = getPlanByType(selectedDietary, planType.key);
            
            return (
              <Card key={planType.key} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{planType.icon}</span>
                      {planType.label}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(selectedDietary, planType.key)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plan ? (
                    <>
                      <div>
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <p className="text-2xl font-bold text-primary">{formatPrice(plan.price)}</p>
                        <p className="text-sm text-muted-foreground">{plan.duration} days</p>
                      </div>
                      
                      {plan.description && (
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      )}
                      
                      {plan.features && plan.features.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Features:</h4>
                          <ul className="text-sm space-y-1">
                            {plan.features.map((feature: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {plan.weeklyMeals && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Weekly Meals:</h4>
                          <div className="text-xs space-y-1">
                            {Object.entries(plan.weeklyMeals).map(([day, meals]: [string, any]) => (
                              <div key={day}>
                                <span className="font-medium">{day}:</span> {meals.mainDish}
                                {meals.sides && ` + ${meals.sides.join(', ')}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">No plan configured</p>
                      <Button
                        variant="outline"
                        onClick={() => openEditDialog(selectedDietary, planType.key)}
                      >
                        Create Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {editingPlan?.type?.charAt(0).toUpperCase()}{editingPlan?.type?.slice(1)} Plan
            </DialogTitle>
            <DialogDescription>
              Configure the plan details for {selectedDietary} dietary preference
            </DialogDescription>
          </DialogHeader>
          
          {editingPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Plan Name</label>
                  <Input
                    value={editingPlan.name}
                    onChange={(e) => updateEditingPlan('name', e.target.value)}
                    placeholder="Enter plan name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Price (₹)</label>
                  <Input
                    type="number"
                    value={editingPlan.price}
                    onChange={(e) => updateEditingPlan('price', parseFloat(e.target.value) || 0)}
                    placeholder="Enter price"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Duration (days)</label>
                <Input
                  type="number"
                  value={editingPlan.duration}
                  onChange={(e) => updateEditingPlan('duration', parseInt(e.target.value) || 30)}
                  placeholder="Enter duration"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingPlan.description}
                  onChange={(e) => updateEditingPlan('description', e.target.value)}
                  placeholder="Enter plan description"
                  rows={3}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Features</label>
                  <Button variant="outline" size="sm" onClick={addFeature}>
                    Add Feature
                  </Button>
                </div>
                <div className="space-y-2">
                  {editingPlan.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter feature"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSavePlan}
              disabled={updatePlanMutation.isPending}
            >
              {updatePlanMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Plan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}