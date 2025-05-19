import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart as ShoppingCartIcon, Minus, Plus, PlusCircle, MessageSquare } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ModernCartProps {
  cartItems: any[];
  loading: boolean;
  updateCartItem: (id: number, quantity: number) => Promise<void>;
  removeCartItem: (id: number) => Promise<void>;
  handleCustomizeItem: (item: any) => void;
  calculateCartTotal: () => number;
  calculateMealPrice: (item: any) => number;
  hasCurryOptions: (meal: any) => boolean;
  onContinueShopping: () => void;
  deliveryType: string;
  handleNextStep: () => void;
}

const ModernCart: React.FC<ModernCartProps> = ({
  cartItems,
  loading,
  updateCartItem,
  removeCartItem,
  handleCustomizeItem,
  calculateCartTotal,
  calculateMealPrice,
  hasCurryOptions,
  onContinueShopping,
  deliveryType,
  handleNextStep,
}) => {
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState<string>("");

  const isEditingNotes = (id: number) => editingItemId === id;

  const handleEditNotes = (item: any) => {
    setEditingItemId(item.id);
    setNoteText(item.notes || "");
  };

  const handleSaveNotes = async (item: any) => {
    try {
      // The actual implementation would make an API call to update the notes
      // This is a simplified version
      console.log(`Saving notes for item ${item.id}: ${noteText}`);
      setEditingItemId(null);
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-20 h-20 mx-auto bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
          <ShoppingCartIcon className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
        <p className="text-gray-500 mb-6 text-sm">
          Add some delicious millet meals to get started
        </p>
        <Button
          onClick={onContinueShopping}
          className="text-sm py-2 h-auto rounded-full px-6"
        >
          Browse Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 space-y-4 flex-grow overflow-y-auto">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100"
          >
            <div className="flex p-3">
              <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                <img
                  src={item.meal?.imageUrl || "/placeholder-meal.jpg"}
                  alt={item.meal?.name || "Meal item"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow px-3">
                <div className="flex justify-between">
                  <h4 className="font-medium text-sm">
                    {item.meal?.name}
                  </h4>
                  <p className="font-semibold text-sm text-primary">
                    {formatPrice(calculateMealPrice(item))}
                  </p>
                </div>
                
                {((item.meal as any)?.curryOption ||
                  (item.meal as any)?.selectedCurry ||
                  item.curryOptionName) && (
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-800 border border-amber-200">
                      {(item.meal as any)?.curryOption?.name ||
                        (item.meal as any)?.selectedCurry?.name ||
                        item.curryOptionName}
                      {((item.meal as any)?.curryOption?.priceAdjustment > 0 ||
                        (item.meal as any)?.selectedCurry?.priceAdjustment > 0 ||
                        (item.curryOptionPrice && item.curryOptionPrice > 0)) && (
                        <span className="ml-1 font-medium">
                          (+
                          {formatPrice(
                            (item.meal as any)?.curryOption?.priceAdjustment ||
                              (item.meal as any)?.selectedCurry?.priceAdjustment ||
                              item.curryOptionPrice ||
                              0
                          )}
                          )
                        </span>
                      )}
                    </span>
                  </div>
                )}
                
                {item.notes && !isEditingNotes(item.id) && (
                  <p className="text-xs text-gray-600 mt-1 flex items-start">
                    <MessageSquare className="h-3 w-3 mr-1 mt-0.5 text-gray-400" />
                    {item.notes}
                  </p>
                )}

                {isEditingNotes(item.id) && (
                  <div className="mt-2">
                    <textarea
                      className="w-full text-xs p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Add special instructions..."
                      rows={2}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                    />
                    <div className="flex space-x-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8"
                        onClick={() => setEditingItemId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleSaveNotes(item)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => {
                    if (item.quantity > 1) {
                      updateCartItem(item.id, item.quantity - 1);
                    } else {
                      removeCartItem(item.id);
                    }
                  }}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <span className="text-sm font-medium w-8 text-center">
                  {item.quantity}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => updateCartItem(item.id, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex space-x-1">
                {hasCurryOptions(item.meal) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => handleCustomizeItem(item)}
                  >
                    <PlusCircle className="mr-1 h-3 w-3" />
                    Customize
                  </Button>
                )}
                
                {!isEditingNotes(item.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => handleEditNotes(item)}
                  >
                    {item.notes ? "Edit Note" : "Add Note"}
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeCartItem(item.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bill Details Section */}
      <div className="px-4 py-4 border-t mt-auto">
        <h3 className="font-medium text-base mb-3">Bill Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Items Total</span>
            <span>{formatPrice(calculateCartTotal())}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Charge</span>
            <span>{formatPrice(deliveryType === "express" ? 60 : 40)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Platform Fee</span>
            <span>{formatPrice(20)}</span>
          </div>

          <div className="flex justify-between font-medium text-base pt-2 border-t">
            <span>Total Amount</span>
            <span>
              {formatPrice(calculateCartTotal() + (deliveryType === "express" ? 60 : 40) + 20)}
            </span>
          </div>
        </div>

        <Button
          className="w-full mt-4 rounded-md py-2 h-auto"
          onClick={handleNextStep}
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
};

export default ModernCart;