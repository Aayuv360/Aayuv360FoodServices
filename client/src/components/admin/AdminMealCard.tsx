import { useState } from "react";
import { Edit, Trash2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Meal } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface AdminMealCardProps {
  meal: Meal & {
    imageUrl?: string;
  };
  onEditMeal: (meal: Meal) => void;
  onDeleteMeal: (mealId: number) => void;
  onManageCurryOptions: (meal: Meal) => void;
}

const AdminMealCard = ({ 
  meal, 
  onEditMeal, 
  onDeleteMeal, 
  onManageCurryOptions 
}: AdminMealCardProps) => {
  // Map dietary preferences to color schemes
  const dietaryBadgeColor = (preference: string) => {
    switch (preference) {
      case "vegetarian":
        return "bg-green-100 text-green-800";
      case "gluten-free":
        return "bg-yellow-100 text-yellow-800";
      case "high-protein":
        return "bg-blue-100 text-blue-800";
      case "spicy":
        return "bg-red-100 text-red-800";
      case "low-carb":
        return "bg-purple-100 text-purple-800";
      case "vegan":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditClick = () => {
    onEditMeal(meal);
  };

  const handleManageCurryClick = () => {
    onManageCurryOptions(meal);
  };

  return (
    <Card className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition duration-300">
      <div className="relative">
        <img
          src={meal.imageUrl || "/meal-placeholder.jpg"}
          alt={meal.name}
          className="w-full h-48 object-cover"
        />
        <Badge 
          variant={meal.available ? "default" : "secondary"}
          className="absolute top-2 right-2"
        >
          {meal.available ? "Available" : "Unavailable"}
        </Badge>
      </div>
      
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg">{meal.name}</h3>
          <p className="font-bold text-lg">{formatPrice(meal.price)}</p>
        </div>
        
        <p className="text-sm text-gray-600 h-12 overflow-hidden">{meal.description}</p>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {meal.dietaryPreferences?.map((pref, index) => (
            <span
              key={index}
              className={`text-xs px-2 py-1 rounded-full ${dietaryBadgeColor(pref)}`}
            >
              {pref}
            </span>
          ))}
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          <span className="font-medium">Millet Type:</span> {meal.milletType}
        </div>
        
        <div className="text-xs text-gray-500">
          <span className="font-medium">Meal Type:</span> {meal.mealType}
        </div>

        {meal.curryOptions && meal.curryOptions.length > 0 && (
          <div className="text-xs text-gray-500">
            <span className="font-medium">Curry Options:</span> {meal.curryOptions.length} options
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleEditClick}
        >
          <Edit className="h-4 w-4 mr-1" /> Edit
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleManageCurryClick}
        >
          <PlusCircle className="h-4 w-4 mr-1" /> Curry Options
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Meal</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {meal.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDeleteMeal(meal.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default AdminMealCard;