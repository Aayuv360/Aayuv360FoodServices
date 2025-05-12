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
}

const AdminMealCard = ({ 
  meal, 
  onEditMeal, 
  onDeleteMeal
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

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
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
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-gray-900">{meal.name}</h3>
          <p className="font-bold text-lg text-primary">{formatPrice(meal.price)}</p>
        </div>
        
        <p className="text-sm text-gray-600 h-12 overflow-hidden line-clamp-2">{meal.description}</p>
        
        <div className="flex flex-wrap gap-1 mt-3 mb-4">
          {meal.dietaryPreferences?.map((pref, index) => (
            <span
              key={index}
              className={`text-xs px-2 py-0.5 rounded-full ${dietaryBadgeColor(pref)}`}
            >
              {pref}
            </span>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-700"
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-none bg-white border-red-200 text-red-600 hover:bg-red-50 w-9 px-0"
              >
                <Trash2 className="h-4 w-4" />
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
        </div>
      </div>
    </div>
  );
};

export default AdminMealCard;