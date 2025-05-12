import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Meal } from "@shared/schema";

interface NutritionModalProps {
  meal: Meal;
  open: boolean;
  onClose: () => void;
}

const NutritionModal = ({ meal, open, onClose }: NutritionModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6 fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Nutritional Information</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <h4 className="font-bold text-xl mb-4">{meal.name}</h4>

        <div className="space-y-3">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Calories</span>
            <span>
              {meal.calories ? `${meal.calories} kcal` : "Coming soon"}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Protein</span>
            <span>{meal.protein ? `${meal.protein}g` : "Coming soon"}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Carbohydrates</span>
            <span>{meal.carbs ? `${meal.carbs}g` : "Coming soon"}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Fat</span>
            <span>{meal.fat ? `${meal.fat}g` : "Coming soon"}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Fiber</span>
            <span>{meal.fiber ? `${meal.fiber}g` : "Coming soon"}</span>
          </div>
          {meal.sugar !== undefined && (
            <div className="flex justify-between">
              <span className="font-medium">Sugar</span>
              <span>{meal.sugar}g</span>
            </div>
          )}
        </div>

        <div className="mt-6 bg-neutral-light p-3 rounded-lg">
          <h5 className="font-medium mb-2">Allergen Information</h5>
          <p className="text-sm text-gray-600">
            {meal.allergens && meal.allergens.length > 0
              ? `Contains: ${meal.allergens.join(", ")}.`
              : "Contains: None."}{" "}
            Prepared in a kitchen that processes nuts and gluten.
          </p>
        </div>

        <div className="mt-4 text-center">
          <Button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NutritionModal;
