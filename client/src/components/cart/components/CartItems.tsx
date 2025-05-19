import { useState } from "react";
import { useLocation } from "wouter";
import { MessageSquare, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart as ShoppingCartIcon } from "lucide-react";

interface CartItemsProps {
  editingItemId: number | null;
  setEditingItemId: (id: number | null) => void;
  noteText: string;
  setNoteText: (text: string) => void;
  handleCustomizeItem: (item: any) => void;
  onClose: () => void;
}

const CartItems = ({
  editingItemId,
  setEditingItemId,
  noteText,
  setNoteText,
  handleCustomizeItem,
  onClose,
}: CartItemsProps) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const {
    cartItems,
    updateCartItemNotes,
    updateCartItem,
    removeCartItem,
  } = useCart();

  const hasCurryOptions = (meal: any) => {
    if (!meal) return false;

    if (meal.curryOptions && meal.curryOptions.length > 0) {
      return true;
    }

    if (meal.curryOption || meal.selectedCurry) {
      return true;
    }

    const nameHasCurry = meal.name?.toLowerCase().includes("curry");
    const categoryHasCurry = meal.category?.toLowerCase().includes("curry");

    if (nameHasCurry || categoryHasCurry) {
      return true;
    }

    return false;
  };

  function calculateMealPrice(item: any): number {
    const basePrice = item.meal?.price || 0;

    const curryAdjustment =
      (item.meal as any)?.curryOption?.priceAdjustment ??
      (item.meal as any)?.selectedCurry?.priceAdjustment ??
      item.curryOptionPrice ??
      0;

    return (basePrice + curryAdjustment) * item.quantity;
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 px-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4">
          <ShoppingCartIcon className="w-full h-full" />
        </div>
        <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">
          Your cart is empty
        </p>
        <Button
          onClick={() => {
            navigate("/menu");
            onClose();
          }}
          className="text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
        >
          Browse Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto">
      <div className="px-4 py-3">
        {cartItems.map((item) => {
          const isEditingNotes = editingItemId === item.id;

          const handleEditNotes = () => {
            setEditingItemId(isEditingNotes ? null : item.id);
            setNoteText(item.notes || "");
          };

          const handleSaveNotes = () => {
            updateCartItemNotes(item.id, noteText || null);
            setEditingItemId(null);
            toast({
              title: "Notes saved",
              description: noteText
                ? "Your special instructions were saved"
                : "Notes removed",
            });
          };

          return (
            <div
              key={item.id}
              className="flex items-start border-b py-2 sm:py-3"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden flex-shrink-0">
                <img
                  src={item.meal?.imageUrl || "/placeholder-meal.jpg"}
                  alt={item.meal?.name || "Meal item"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow px-2 sm:px-3">
                <h4 className="font-medium text-xs sm:text-sm line-clamp-1">
                  {item.meal?.name}
                </h4>
                {((item.meal as any)?.curryOption ||
                  (item.meal as any)?.selectedCurry ||
                  item.curryOptionName) && (
                  <p className="text-[10px] sm:text-xs text-gray-600">
                    with{" "}
                    {(item.meal as any)?.curryOption?.name ||
                      (item.meal as any)?.selectedCurry?.name ||
                      item.curryOptionName}
                    {((item.meal as any)?.curryOption?.priceAdjustment > 0 ||
                      (item.meal as any)?.selectedCurry?.priceAdjustment > 0 ||
                      (item.curryOptionPrice && item.curryOptionPrice > 0)) && (
                      <span className="text-primary ml-1">
                        (+
                        {formatPrice(
                          (item.meal as any)?.curryOption?.priceAdjustment ||
                            (item.meal as any)?.selectedCurry
                              ?.priceAdjustment ||
                            item.curryOptionPrice ||
                            0
                        )}
                        )
                      </span>
                    )}
                  </p>
                )}
                {item.notes && !isEditingNotes && (
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1 flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {item.notes}
                  </p>
                )}

                {isEditingNotes && (
                  <div className="mt-1">
                    <textarea
                      className="w-full text-xs p-1 border rounded"
                      placeholder="Add special instructions..."
                      rows={2}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                    />
                    <div className="flex space-x-2 mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] h-6 px-2 py-0"
                        onClick={() => setEditingItemId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="text-[10px] h-6 px-2 py-0"
                        onClick={handleSaveNotes}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-1 sm:mt-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-md"
                      onClick={() =>
                        updateCartItem(item.id, Math.max(1, item.quantity - 1))
                      }
                      disabled={item.quantity <= 1}
                    >
                      <span className="sr-only">Decrease quantity</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-3 h-3"
                      >
                        <path d="M6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" />
                      </svg>
                    </Button>

                    <span className="text-xs font-medium w-4 text-center">
                      {item.quantity}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-md"
                      onClick={() =>
                        updateCartItem(item.id, item.quantity + 1)
                      }
                    >
                      <span className="sr-only">Increase quantity</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-3 h-3"
                      >
                        <path d="M10.75 6.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" />
                      </svg>
                    </Button>
                  </div>

                  <div className="space-x-1">
                    {hasCurryOptions(item.meal) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px]"
                        onClick={() => handleCustomizeItem(item)}
                      >
                        <PlusCircle className="mr-1 h-3 w-3" />
                        Customize
                      </Button>
                    )}

                    {!isEditingNotes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px]"
                        onClick={handleEditNotes}
                      >
                        <MessageSquare className="mr-1 h-3 w-3" />
                        {item.notes ? "Edit Note" : "Add Note"}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeCartItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
              <div className="text-right ml-2 flex-shrink-0">
                <p className="font-medium text-xs sm:text-sm">
                  {formatPrice(calculateMealPrice(item))}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CartItems;