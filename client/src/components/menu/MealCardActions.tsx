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
  const { isItemInCart, getCartItemsForMeal, getLastCurryOption, addToCart, removeCartItem, updateCartItem } = useCart();
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
  
  const handleRepeatLast = async () => {
    if (lastCurryOption) {
      try {
        // Create a meal object with the curry option
        const mealWithCurry = {
          ...meal,
          curryOption: lastCurryOption
        };
        
        // Check if an item with this curry option already exists
        const sameOptionItem = cartItems.find(item => {
          return item.meal?.id === meal.id && 
                 (item.meal as any)?.curryOption?.id === lastCurryOption.id;
        });
        
        if (sameOptionItem) {
          // Item with same curry option exists - increment quantity
          await updateCartItem(sameOptionItem.id, sameOptionItem.quantity + 1);
          
          toast({
            title: "Quantity increased",
            description: `${meal.name} with ${lastCurryOption.name} quantity increased`,
          });
        } else {
          // Add as new
          await addToCart(mealWithCurry);
          
          toast({
            title: "Added to cart",
            description: `${meal.name} with ${lastCurryOption.name} added to your cart`,
          });
        }
        
        setShowRepeatModal(false);
      } catch (error) {
        console.error("Error repeating last selection:", error);
        toast({
          title: "Error",
          description: "There was an error updating your cart. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleAddToCurry = async (selectedMeal: Meal & { curryOption: any }) => {
    try {
      // Check if an item with the SAME curry option already exists
      const sameOptionItem = cartItems.find(item => {
        return item.meal?.id === selectedMeal.id && 
               (item.meal as any)?.curryOption?.id === selectedMeal.curryOption.id;
      });
      
      if (sameOptionItem) {
        // Item with same curry option exists - increment quantity
        await updateCartItem(sameOptionItem.id, sameOptionItem.quantity + 1);
        
        toast({
          title: "Quantity increased",
          description: `${selectedMeal.name} with ${selectedMeal.curryOption.name} quantity increased`,
        });
      } else {
        // Item with this curry option doesn't exist - add as new
        await addToCart(selectedMeal, 1);
        
        toast({
          title: "Added to cart",
          description: `${selectedMeal.name} with ${selectedMeal.curryOption.name} added to your cart`,
        });
      }
      
      setShowCurryOptionsModal(false);
    } catch (error) {
      console.error("Error adding item to cart:", error);
      toast({
        title: "Error",
        description: "There was an error updating your cart. Please try again.",
        variant: "destructive",
      });
    }
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