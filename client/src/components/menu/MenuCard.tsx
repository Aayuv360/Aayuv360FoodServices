import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import NutritionModal from "./NutritionModal";
import { MealCardActions } from "./MealCardActions";
import { Meal } from "@shared/schema";
import { formatPrice } from "@/lib/utils";

interface MenuCardProps {
  meal: Meal & {
    imageUrl?: string;
  };
}

const MenuCard = ({ meal }: MenuCardProps) => {
  const [nutritionModalOpen, setNutritionModalOpen] = useState(false);

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

  return (
    <div className="group perspective-2000">
      <div className="bg-white rounded-lg overflow-hidden shadow-card-3d hover:shadow-hover-3d transition-all duration-500 transform hover:-translate-y-2 hover:rotate-y-2 hover:scale-105">
        <div className="relative h-48 overflow-hidden">
          <img
            src={
              meal.imageUrl ||
              "https://via.placeholder.com/300x200?text=Millet+Meal"
            }
            alt={meal.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {meal.isPopular && (
            <div className="absolute top-2 right-2 bg-accent text-white text-xs rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs">
              Popular
            </div>
          )}
          {meal.isNew && (
            <div className="absolute top-2 right-2 bg-secondary text-white text-xs rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs">
              New
            </div>
          )}
        </div>
        <div className="p-4 transform transition-transform duration-500 group-hover:translate-z-10">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">
              {meal.name}
            </h3>

            <div className="flex items-center ml-2 flex-shrink-0">
              <span className="text-orange-500 font-semibold text-sm sm:text-base">
                {formatPrice(meal.price)}
              </span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {meal.description}
          </p>
          {/* <div className="flex flex-wrap gap-2 mb-4">
            {meal.dietaryPreferences?.map((preference, index) => (
              <span
                key={index}
                className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${dietaryBadgeColor(preference)}`}
              >
                {preference.charAt(0).toUpperCase() + preference.slice(1)}
              </span>
            ))}
          </div> */}

          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm py-1 px-3 h-auto"
              onClick={() => setNutritionModalOpen(true)}
            >
              <Info className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="xs:inline">Nutrition</span>
            </Button>
            <MealCardActions meal={meal} />
          </div>
        </div>
      </div>

      <NutritionModal
        meal={meal}
        open={nutritionModalOpen}
        onClose={() => setNutritionModalOpen(false)}
      />
    </div>
  );
};

export default MenuCard;
