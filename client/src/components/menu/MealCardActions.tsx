import React, { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { CurryOptionsModal } from "./CurryOptionsModal";
import { RepeatCustomizationModal } from "./RepeatCustomizationModal";
import { Meal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface MealCardActionsProps {
  meal: Meal;
}

export function MealCardActions({ meal }: MealCardActionsProps) {
  const { isItemInCart, getCartItemsForMeal, getLastCurryOption, addToCart, removeCartItem } = useCart();
  const { toast } = useToast();
  
  const [showCurryOptionsModal, setShowCurryOptionsModal] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  
  const inCart = isItemInCart(meal.id);
  const cartItems = getCartItemsForMeal(meal.id);
  const lastCurryOption = getLastCurryOption(meal.id);
  
  const handleAddClick = () => {
    // Always show curry option selection directly (Swiggy-like experience)
    setShowCurryOptionsModal(true);
  };
  
  const handleRemoveClick = async () => {
    // Check if there are multiple different curry options for this meal
    if (cartItems.length > 1) {
      // Show a message that they need to remove from cart directly
      toast({
        title: "Multiple customizations",
        description: "This item has multiple customizations added. Please remove the specific item from the cart.",
        variant: "destructive",
      });
      return;
    }
    
    // If only one customization exists
    if (cartItems.length === 1) {
      const cartItem = cartItems[0];
      
      try {
        await removeCartItem(cartItem.id);
        toast({
          title: "Removed from cart",
          description: `${meal.name} removed from your cart`
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not remove item from cart",
          variant: "destructive",
        });
      }
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
      
      const isUpdate = inCart;
      toast({
        title: isUpdate ? "Updated selection" : "Added to cart",
        description: isUpdate 
          ? `${meal.name} with ${lastCurryOption.name} updated in your cart` 
          : `${meal.name} with ${lastCurryOption.name} added to your cart`,
      });
    }
  };
  
  const handleAddToCurry = (selectedMeal: Meal & { curryOption: any }) => {
    addToCart(selectedMeal);
    setShowCurryOptionsModal(false);
    
    const isUpdate = inCart;
    toast({
      title: isUpdate ? "Updated selection" : "Added to cart",
      description: isUpdate 
        ? `${meal.name} with ${selectedMeal.curryOption.name} updated in your cart` 
        : `${meal.name} with ${selectedMeal.curryOption.name} added to your cart`,
    });
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
        lastCurryOption={lastCurryOption}
        isInCart={inCart}
      />
      
      <RepeatCustomizationModal
        open={showRepeatModal}
        onClose={() => setShowRepeatModal(false)}
        meal={meal}
        onChooseNew={handleChooseNew}
        onRepeatLast={handleRepeatLast}
        lastCurryOption={lastCurryOption}
        isInCart={inCart}
      />
    </>
  );
}