import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { Meal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";

interface MealPlan {
  date: string;
  mealId: number;
  meal?: Meal;
}

interface MealPlannerCalendarProps {
  onSelectMeal?: (meal: Meal) => void;
}

export default function MealPlannerCalendar({ onSelectMeal }: MealPlannerCalendarProps) {
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date()));
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch meal plan for the selected week
  const fetchMealPlan = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const endDate = addDays(startDate, 6);
      const response = await apiRequest(
        "GET", 
        `/api/meal-plan?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch meal plan");
      }
      
      const data = await response.json();
      setMealPlan(data);
    } catch (error: any) {
      console.error("Error fetching meal plan:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load meal plan when component mounts or week changes
  useEffect(() => {
    if (user) {
      fetchMealPlan();
    }
  }, [startDate, user]);
  
  // Navigate to previous week
  const previousWeek = () => {
    setStartDate(prev => addDays(prev, -7));
  };
  
  // Navigate to next week
  const nextWeek = () => {
    setStartDate(prev => addDays(prev, 7));
  };
  
  // Generate the days of the week from start date
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Your Meal Plan</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={previousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              {format(startDate, "MMM d")} - {format(addDays(startDate, 6), "MMM d, yyyy")}
            </div>
            <Button variant="outline" size="icon" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Your personalized meal schedule for the week
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {daysOfWeek.map((day, index) => (
            <div key={`header-${index}`} className="text-center">
              <div className="text-sm font-medium">{format(day, "EEE")}</div>
              <div className="text-xs text-muted-foreground">{format(day, "MMM d")}</div>
            </div>
          ))}
          
          {/* Meal cards */}
          {loading ? (
            // Loading skeleton
            Array.from({ length: 7 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="flex flex-col items-center">
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </div>
            ))
          ) : mealPlan.length === 0 ? (
            // No meal plan
            <div className="col-span-7 py-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No meal plan found</h3>
              <p className="text-sm text-muted-foreground">
                {user ? "Subscribe to a meal plan to see your scheduled meals." : "Log in to view your meal plan."}
              </p>
            </div>
          ) : (
            // Show meal plan
            daysOfWeek.map((day, index) => {
              // Find the meal for this day
              const dayPlan = mealPlan.find(plan => 
                isSameDay(new Date(plan.date), day)
              );
              
              return (
                <div key={`meal-${index}`} className="border rounded-md p-2 flex flex-col h-48">
                  {dayPlan?.meal ? (
                    <>
                      <div className="relative h-24 rounded-md overflow-hidden mb-2">
                        <img 
                          src={dayPlan.meal.imageUrl || "/placeholder-meal.jpg"} 
                          alt={dayPlan.meal.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="text-sm font-medium line-clamp-1">{dayPlan.meal.name}</h4>
                      <div className="mt-auto flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {dayPlan.meal.mealType}
                        </Badge>
                        <span className="text-xs font-medium text-primary">
                          {formatPrice(dayPlan.meal.price)}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-1 w-full text-xs h-7"
                        onClick={() => {
                          if (dayPlan.meal && onSelectMeal) {
                            onSelectMeal(dayPlan.meal);
                          }
                        }}
                      >
                        View Details
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <span className="text-xs text-center">No meal scheduled</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          {user ? (
            <span>Meals are delivered daily between 6-8 PM</span>
          ) : (
            <span>Log in to view and manage your meal plan</span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchMealPlan}>
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}