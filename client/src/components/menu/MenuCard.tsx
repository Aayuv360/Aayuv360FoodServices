import { useState } from "react";
import { Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import NutritionModal from "./NutritionModal";
import CurryOptionsModal from "./CurryOptionsModal";
import { Meal } from "@shared/schema";

interface MenuCardProps {
  meal: Meal;
}

const MenuCard = ({ meal }: MenuCardProps) => {
  const [nutritionModalOpen, setNutritionModalOpen] = useState(false);
  const [curryOptionsModalOpen, setCurryOptionsModalOpen] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${(price / 100).toFixed(2)}`;
  };

  const handleAddToCartClick = () => {
    setCurryOptionsModalOpen(true);
  };

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

  return (
    <>
      <div className="bg-white rounded-lg overflow-hidden card-shadow hover:shadow-lg transition duration-300">
        <div className="relative">
          <img
            src={meal.imageUrl || "https://via.placeholder.com/300x200?text=Millet+Meal"}
            alt={meal.name}
            className="w-full h-48 object-cover"
          />
          {meal.isPopular && (
            <div className="absolute top-2 right-2 bg-accent text-white text-xs rounded-full px-2 py-1">
              Popular
            </div>
          )}
          {meal.isNew && (
            <div className="absolute top-2 right-2 bg-secondary text-white text-xs rounded-full px-2 py-1">
              New
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold">{meal.name}</h3>
            <div className="flex items-center">
              <span className="text-primary font-semibold">{formatPrice(meal.price)}</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-3">{meal.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {meal.dietaryPreferences?.map((preference, index) => (
              <span
                key={index}
                className={`text-xs px-2 py-1 rounded ${dietaryBadgeColor(preference)}`}
              >
                {preference.charAt(0).toUpperCase() + preference.slice(1)}
              </span>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-accent hover:text-primary transition duration-200 flex items-center gap-1"
              onClick={() => setNutritionModalOpen(true)}
            >
              <Info className="h-4 w-4" />
              Nutrition
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleAddToCartClick}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>

      <NutritionModal
        meal={meal}
        open={nutritionModalOpen}
        onClose={() => setNutritionModalOpen(false)}
      />
      
      <CurryOptionsModal
        meal={meal}
        open={curryOptionsModalOpen}
        onClose={() => setCurryOptionsModalOpen(false)}
      />
    </>
  );
};

export default MenuCard;
