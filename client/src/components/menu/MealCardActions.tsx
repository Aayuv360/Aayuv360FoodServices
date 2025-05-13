import React, { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { CurryOptionsModal } from "./CurryOptionsModal";
import { RepeatCustomizationModal } from "./RepeatCustomizationModal";
import { Meal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/use-auth";

interface MealCardActionsProps {
  meal: Meal;
}

export function MealCardActions({ meal }: MealCardActionsProps) {
  const { isItemInCart, getCartItemsForMeal, getLastCurryOption, addToCart, removeCartItem, updateCartItem } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [showCurryOptionsModal, setShowCurryOptionsModal] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingCurryAction, setPendingCurryAction] = useState<boolean>(false);
  
  const inCart = isItemInCart(meal.id);
  const cartItems = getCartItemsForMeal(meal.id);
  const lastCurryOption = getLastCurryOption(meal.id);
  
  // Handle successful authentication
  const handleAuthSuccess = () => {
    // Close the auth modal
    setShowAuthModal(false);
    
    // If we have a pending curry selection and meal has curry options, show the curry options modal
    if (pendingCurryAction && hasCurryOptions()) {
      setPendingCurryAction(false);
      setShowCurryOptionsModal(true);
    } else if (!hasCurryOptions()) {
      // If meal has no curry options, add directly to cart
      addMealDirectlyToCart();
    }
  };
  
  // Helper function to check if meal has curry options
  const hasCurryOptions = () => {
    if (!meal.curryOptions) return false;
    return meal.curryOptions.length > 0;
  };
  
  // Helper function to add meal directly to cart without customization
  const addMealDirectlyToCart = async () => {
    try {
      // Create a default curry option
      const defaultCurryOption = {
        id: "regular",
        name: "Regular Curry",
        priceAdjustment: 0
      };
      
      // Create meal with default curry option
      const mealWithDefaultCurry = {
        ...meal,
        curryOption: defaultCurryOption
      };
      
      // Check if this item already exists in cart
      const existingItem = cartItems.find(item => 
        item.meal?.id === meal.id && 
        (item.meal as any)?.curryOption?.id === defaultCurryOption.id
      );
      
      if (existingItem) {
        // Increment quantity of existing item
        await updateCartItem(existingItem.id, existingItem.quantity + 1);
        
        toast({
          title: "Quantity increased",
          description: `${meal.name} quantity increased`,
        });
      } else {
        // Add as new
        await addToCart(mealWithDefaultCurry);
        
        toast({
          title: "Added to cart",
          description: `${meal.name} added to your cart`,
        });
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
      toast({
        title: "Error",
        description: "There was an error updating your cart. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddClick = () => {
    // If user is not logged in, show auth modal
    if (!user) {
      // If meal has no curry options, we'll add directly after login
      if (!hasCurryOptions()) {
        // After login, we'll add directly instead of showing curry options
        setPendingCurryAction(false);
      } else {
        // After login, we'll show curry options
        setPendingCurryAction(true);
      }
      
      setShowAuthModal(true);
      return;
    }
    
    // If meal has no curry options, add directly to cart
    if (!hasCurryOptions()) {
      addMealDirectlyToCart();
      return;
    }
    
    // If meal has curry options, show the customization modal
    setShowCurryOptionsModal(true);
  };
  
  const handleRemoveClick = async () => {
    // If user is not logged in, show auth modal
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
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
      // If user is not logged in, show auth modal and return
      if (!user) {
        setShowCurryOptionsModal(false);
        setShowAuthModal(true);
        return;
      }
      
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
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message === "authentication_required") {
        setShowCurryOptionsModal(false);
        setShowAuthModal(true);
        return;
      }
      
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
      
      {/* Auth Modal for login/signup when trying to add to cart while not logged in */}
      <AuthModal 
        isOpen={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultTab="login"
        mode="normal"
        redirectUrl="" 
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}