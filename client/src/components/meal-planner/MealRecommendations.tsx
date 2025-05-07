import { useState, useEffect } from "react";
import { Meal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MealRecommendationsProps {
  count?: number;
  onSelectMeal?: (meal: Meal) => void;
  onAddToCart?: (meal: Meal) => void;
}

export default function MealRecommendations({ 
  count = 4, 
  onSelectMeal, 
  onAddToCart 
}: MealRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Meal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch meal recommendations
  const fetchRecommendations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await apiRequest(
        "GET", 
        `/api/meal-recommendations?count=${count}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }
      
      const data = await response.json();
      setRecommendations(data);
    } catch (error: any) {
      console.error("Error fetching recommendations:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load recommendations when component mounts
  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Recommended for You</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchRecommendations} 
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-1">Refresh</span>
          </Button>
        </div>
        <CardDescription>
          Personalized meals based on your preferences
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            // Loading skeleton
            Array.from({ length: count }).map((_, index) => (
              <div key={`skeleton-${index}`} className="flex flex-col">
                <Skeleton className="h-40 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 mt-2" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </div>
            ))
          ) : recommendations.length === 0 ? (
            // No recommendations
            <div className="col-span-full py-6 text-center">
              <p className="text-muted-foreground">
                {user 
                  ? "We couldn't find any recommendations for you. Try refreshing or updating your preferences."
                  : "Log in to see personalized meal recommendations."}
              </p>
            </div>
          ) : (
            // Show recommendations
            recommendations.map((meal) => (
              <Card key={meal.id} className="overflow-hidden">
                <div className="h-40 overflow-hidden">
                  <img 
                    src={meal.imageUrl || "/placeholder-meal.jpg"} 
                    alt={meal.name}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <h4 className="font-medium line-clamp-1">{meal.name}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="outline" className="text-xs">
                      {meal.mealType}
                    </Badge>
                    <span className="text-sm font-medium text-primary">
                      {formatPrice(meal.price)}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => onSelectMeal && onSelectMeal(meal)}
                    >
                      Details
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => onAddToCart && onAddToCart(meal)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
      
      {recommendations.length > 0 && (
        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-sm text-muted-foreground">
            Recommendations are based on your dietary preferences and order history
          </p>
        </CardFooter>
      )}
    </Card>
  );
}