import { useState } from "react";
import { Meal } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import MealPlannerCalendar from "@/components/meal-planner/MealPlannerCalendar";
import MealRecommendations from "@/components/meal-planner/MealRecommendations";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";
import { GanttChartSquare, PlusCircle, ShoppingCart } from "lucide-react";

export default function MealPlannerPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  
  // Handle meal selection for details view
  const handleSelectMeal = (meal: Meal) => {
    setSelectedMeal(meal);
  };
  
  // Handle adding a meal to the cart
  const handleAddToCart = async (meal: Meal) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    
    try {
      await addToCart(meal);
      toast({
        title: "Added to cart",
        description: `${meal.name} has been added to your cart.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not add to cart",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold">Meal Planner</h1>
        <p className="text-muted-foreground">
          Plan your meals for the week or explore our recommendations
        </p>
      </div>
      
      <Tabs defaultValue="calendar" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">
            <GanttChartSquare className="h-4 w-4 mr-2" />
            Your Meal Plan
          </TabsTrigger>
          <TabsTrigger value="recommended">
            <PlusCircle className="h-4 w-4 mr-2" />
            Recommended Meals
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="pt-2">
          {user ? (
            <MealPlannerCalendar onSelectMeal={handleSelectMeal} />
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">Sign in to view your meal plan</h3>
              <p className="text-muted-foreground mb-4">
                Create an account or sign in to view and manage your personalized meal plan
              </p>
              <Button onClick={() => setAuthModalOpen(true)}>
                Sign In
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recommended" className="pt-2">
          <MealRecommendations 
            count={8} 
            onSelectMeal={handleSelectMeal} 
            onAddToCart={handleAddToCart}
          />
        </TabsContent>
      </Tabs>
      
      {/* Authentication Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onOpenChange={setAuthModalOpen}
        redirectUrl="/meal-planner"
      />
      
      {/* Meal Details Dialog */}
      <Dialog open={!!selectedMeal} onOpenChange={(open) => !open && setSelectedMeal(null)}>
        {selectedMeal && (
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedMeal.name}</DialogTitle>
              <DialogDescription>
                {selectedMeal.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-60 rounded-md overflow-hidden">
                <img 
                  src={selectedMeal.imageUrl || "/placeholder-meal.jpg"} 
                  alt={selectedMeal.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Meal Type</h4>
                  <Badge>{selectedMeal.mealType}</Badge>
                </div>
                
                {selectedMeal.dietaryPreferences && selectedMeal.dietaryPreferences.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Dietary Preferences</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMeal.dietaryPreferences.map((pref) => (
                        <Badge key={pref} variant="outline">{pref}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedMeal.allergens && selectedMeal.allergens.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Contains Allergens</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMeal.allergens.map((allergen) => (
                        <Badge key={allergen} variant="destructive">{allergen}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Nutritional Information</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedMeal.calories && (
                      <div className="bg-muted/40 p-2 rounded text-center">
                        <div className="text-sm font-bold">{selectedMeal.calories}</div>
                        <div className="text-xs text-muted-foreground">Calories</div>
                      </div>
                    )}
                    {selectedMeal.protein && (
                      <div className="bg-muted/40 p-2 rounded text-center">
                        <div className="text-sm font-bold">{selectedMeal.protein}g</div>
                        <div className="text-xs text-muted-foreground">Protein</div>
                      </div>
                    )}
                    {selectedMeal.carbs && (
                      <div className="bg-muted/40 p-2 rounded text-center">
                        <div className="text-sm font-bold">{selectedMeal.carbs}g</div>
                        <div className="text-xs text-muted-foreground">Carbs</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-2xl font-bold text-primary">
                {formatPrice(selectedMeal.price)}
              </div>
              <Button onClick={() => handleAddToCart(selectedMeal)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}