import React, { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { CurryOptionsModal } from "./CurryOptionsModal";
import { Meal } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/use-auth";

interface MealCardActionsProps {
  meal: Meal;
}

export function MealCardActions({ meal }: MealCardActionsProps) {
  const {
    isItemInCart,
    getCartItemsForMeal,
    getLastCurryOption,
    addToCart,
    removeCartItem,
    updateCartItem,
  } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();

  const [showCurryOptionsModal, setShowCurryOptionsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingCurryAction, setPendingCurryAction] = useState<boolean>(false);

  const inCart = isItemInCart(meal.id);
  const cartItems = getCartItemsForMeal(meal.id);
  const lastCurryOption = getLastCurryOption(meal.id);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (pendingCurryAction && hasCurryOptions()) {
      setPendingCurryAction(false);
      setShowCurryOptionsModal(true);
    } else if (!hasCurryOptions()) {
      addMealDirectlyToCart();
    }
  };

  const hasCurryOptions = () => {
    if (!meal.curryOptions) return false;
    return meal.curryOptions.length > 0;
  };

  const addMealDirectlyToCart = async () => {
    try {
      const defaultCurryOption = {
        id: "regular",
        name: "Regular Curry",
        priceAdjustment: 0,
      };

      const mealWithDefaultCurry = {
        ...meal,
        curryOption: defaultCurryOption,
      };

      const existingItem = cartItems.find((item) => item.meal?.id === meal.id);

      if (existingItem) {
        await updateCartItem(existingItem.id, existingItem.quantity + 1);

        toast({
          title: "Quantity increased",
          description: `${meal.name} quantity increased`,
        });
      } else {
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
    if (!user) {
      if (!hasCurryOptions()) {
        setPendingCurryAction(false);
      } else {
        setPendingCurryAction(true);
      }

      setShowAuthModal(true);
      return;
    }

    if (!hasCurryOptions()) {
      addMealDirectlyToCart();
      return;
    }

    setShowCurryOptionsModal(true);
  };

  const handleRemoveClick = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (cartItems.length > 1) {
      toast({
        title: "Multiple customizations",
        description:
          "This item has multiple customizations added. Please remove the specific item from the cart.",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 1) {
      const cartItem = cartItems[0];

      try {
        await removeCartItem(cartItem.id);
        toast({
          title: "Removed from cart",
          description: `${meal.name} removed from your cart`,
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

  const handleAddToCurry = async (
    selectedMeal: Meal,
    selectedCurryOption: any,
  ) => {
    try {
      if (!user) {
        setShowCurryOptionsModal(false);
        setShowAuthModal(true);
        return;
      }

      const existingItem = cartItems.find((item) => {
        console.log(item, selectedCurryOption);
        return (
          item.meal?.id === selectedMeal.id &&
          item.meal?.selectedCurry?.id === selectedCurryOption?.id
        );
      });

      if (existingItem) {
        await updateCartItem(existingItem.id, existingItem.quantity + 1);

        toast({
          title: "Quantity increased",
          description: `${selectedMeal.name} with ${selectedCurryOption?.name} quantity increased`,
        });
      } else {
        const mealWithCurry = {
          ...selectedMeal,
          curryOption: selectedCurryOption,
        };
        await addToCart(mealWithCurry, 1);

        toast({
          title: "Added to cart",
          description: `${selectedMeal.name} with ${selectedCurryOption?.name} added to your cart`,
        });
      }

      setShowCurryOptionsModal(false);
    } catch (error) {
      console.error("Error adding item to cart:", error);

      if (
        error instanceof Error &&
        error.message === "authentication_required"
      ) {
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
        <div className="flex items-center rounded-full text-xs sm:text-sm bg-primary">
          <Button
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full font-extrabold"
            onClick={handleRemoveClick}
          >
            <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </Button>
          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 font-extrabold">
            {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
          <Button
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full font-extrabold"
            onClick={handleAddClick}
          >
            <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          className="rounded-full text-xs sm:text-sm py-1 px-3 h-auto"
          onClick={handleAddClick}
        >
          Add
        </Button>
      )}

      <CurryOptionsModal
        open={showCurryOptionsModal}
        onClose={() => setShowCurryOptionsModal(false)}
        meal={meal}
        onAddToCart={handleAddToCurry}
        lastCurryOption={lastCurryOption}
        isInCart={inCart}
      />

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
