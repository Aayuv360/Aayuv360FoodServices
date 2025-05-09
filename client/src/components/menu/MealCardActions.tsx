import React, { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { CurryOptionsModal } from "./CurryOptionsModal";
import { RepeatCustomizationModal } from "./RepeatCustomizationModal";
import { Meal } from "@shared/schema";

interface MealCardActionsProps {
  meal: Meal;
}

export function MealCardActions({ meal }: MealCardActionsProps) {
  const { isItemInCart, getCartItemsForMeal, getLastCurryOption, addToCart, removeCartItem } = useCart();
  
  const [showCurryOptionsModal, setShowCurryOptionsModal] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  
  const inCart = isItemInCart(meal.id);
  const cartItems = getCartItemsForMeal(meal.id);
  const lastCurryOption = getLastCurryOption(meal.id);
  
  const handleAddClick = () => {
    // If we have a last curry option for this meal, show the repeat modal
    if (lastCurryOption) {
      setShowRepeatModal(true);
    } else {
      // Otherwise, show curry option selection directly
      setShowCurryOptionsModal(true);
    }
  };
  
  const handleRemoveClick = () => {
    // If there are multiple items with the same meal ID (different curry options),
    // we might need a more sophisticated UI, but for now just remove the first one
    if (cartItems.length > 0) {
      removeCartItem(cartItems[0].id);
    }
  };
  
  const handleChooseNew = () => {
    setShowRepeatModal(false);
    setShowCurryOptionsModal(true);
  };
  
  const handleRepeatLast = () => {
    if (lastCurryOption) {
      // Create a meal object with the curry option
      const mealWithCurry = {
        ...meal,
        curryOption: lastCurryOption
      };
      
      addToCart(mealWithCurry);
      setShowRepeatModal(false);
    }
  };
  
  const handleAddToCurry = (selectedMeal: Meal) => {
    addToCart(selectedMeal);
    setShowCurryOptionsModal(false);
  };
  
  return (
    <>
      {inCart ? (
        <div className="flex items-center border rounded-full">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleRemoveClick}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="px-2 py-1">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleAddClick}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={handleAddClick}
        >
          Add
        </Button>
      )}
      
      {/* Modals */}
      <CurryOptionsModal
        open={showCurryOptionsModal}
        onClose={() => setShowCurryOptionsModal(false)}
        meal={meal}
        onAddToCart={handleAddToCurry}
      />
      
      <RepeatCustomizationModal
        open={showRepeatModal}
        onClose={() => setShowRepeatModal(false)}
        meal={meal}
        onChooseNew={handleChooseNew}
        onRepeatLast={handleRepeatLast}
        lastCurryOption={lastCurryOption}
      />
    </>
  );
}