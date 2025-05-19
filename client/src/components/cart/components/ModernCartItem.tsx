import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, PlusCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ModernCartItemProps {
  item: any;
  updateCartItem: (id: number, quantity: number) => Promise<void>;
  removeCartItem: (id: number) => Promise<void>;
  handleCustomizeItem: (item: any) => void;
  handleEditNotes: (item: any) => void;
  isEditingNotes: (id: number) => boolean;
  hasCurryOptions: (meal: any) => boolean;
  calculateMealPrice: (item: any) => number;
}

const ModernCartItem: React.FC<ModernCartItemProps> = ({
  item,
  updateCartItem,
  removeCartItem,
  handleCustomizeItem,
  handleEditNotes,
  isEditingNotes,
  hasCurryOptions,
  calculateMealPrice,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 mb-4">
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1 mt-0.5 text-gray-400">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              {item.notes}
            </p>
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
  );
};

export default ModernCartItem;