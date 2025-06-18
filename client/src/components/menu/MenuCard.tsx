import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MealCardActions } from "./MealCardActions";
import { Meal } from "@shared/schema";
import { formatPrice } from "@/lib/utils";
import { useLocation } from "wouter";

interface MenuCardProps {
  meal: Meal & {
    imageUrl?: string;
  };
  setNutritionModalOpen: any;
  setMealData: any;
}

const MenuCard = ({
  meal,
  setNutritionModalOpen,
  setMealData,
}: MenuCardProps) => {
  const [_, setLocation] = useLocation();
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
  const handleCardClick = () => {
    setLocation(`/MealDetails/${meal.id}`);
  };

  const handleNutritionClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation
    setNutritionModalOpen(true);
    setMealData(meal);
  };
  {
    /* onClick={handleCardClick} */
  }
  return (
    <div className="relative w-full pb-[100%] bg-white rounded-2xl shadow-lg overflow-hidden transform transition duration-500 hover:scale-103 hover:shadow-xl group">
      <img
        src={
          meal.imageUrl ||
          "https://via.placeholder.com/300x200?text=Millet+Meal"
        }
        alt={meal.name}
        className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-end text-white">
        <div className="mb-auto">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-lg font-bold font-inter leading-tight truncate text-shadow-md">
              {meal.name}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm py-1 px-3 h-auto"
              onClick={handleNutritionClick}
            >
              <Info className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Nutrition</span>
            </Button>
          </div>
          <p className="text-xs font-medium font-inter line-clamp-2 text-shadow-sm">
            {meal.description}
          </p>
        </div>

        <div className="flex justify-between items-center mt-3">
          <span className="text-2xl font-extrabold text-orange-500 font-inter text-shadow-sm">
            {formatPrice(meal.price)}
          </span>
          <div className="flex flex-col space-y-1 ml-2">
            <MealCardActions meal={meal} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
