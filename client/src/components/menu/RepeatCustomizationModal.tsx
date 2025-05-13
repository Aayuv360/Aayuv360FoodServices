import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Meal } from "@shared/schema";
import { formatPrice } from "@/lib/utils";

interface RepeatCustomizationModalProps {
  open: boolean;
  onClose: () => void;
  meal: Meal;
  onChooseNew: () => void;
  onRepeatLast: () => void;
  lastCurryOption?: {
    id: string;
    name: string;
    priceAdjustment: number;
  };
  isInCart?: boolean;
}

export function RepeatCustomizationModal({
  open,
  onClose,
  meal,
  onChooseNew,
  onRepeatLast,
  lastCurryOption,
  isInCart = false
}: RepeatCustomizationModalProps) {
  // Using imported formatPrice function from utils

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-4 sm:p-6 max-h-[90vh] overflow-auto">
        <DialogHeader className="pb-2 sm:pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base sm:text-lg">
              {isInCart ? 'Update your customization?' : 'Repeat previous customization?'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 sm:h-6 sm:w-6"
              onClick={onClose}
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          <DialogDescription className="text-xs sm:text-sm mt-1">
            {isInCart 
              ? `How would you like to update ${meal.name} in your cart?` 
              : `How would you like to add ${meal.name} to your cart?`}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
          {lastCurryOption && (
            <div className="bg-primary/5 p-3 sm:p-4 rounded-lg">
              <h3 className="font-medium text-sm sm:text-base mb-1">Last Selection</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                {meal.name} with {lastCurryOption.name}
                {lastCurryOption.priceAdjustment > 0 && (
                  <span className="text-primary">
                    {" "}
                    (+{formatPrice(lastCurryOption.priceAdjustment)})
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-2">
            <Button
              onClick={onChooseNew}
              variant="outline"
              className="w-full text-xs sm:text-sm h-auto py-1.5 sm:py-2"
            >
              I'll choose
            </Button>
            <Button
              onClick={onRepeatLast}
              variant="default"
              className="w-full text-xs sm:text-sm h-auto py-1.5 sm:py-2"
              disabled={!lastCurryOption}
            >
              {isInCart ? 'Keep previous' : 'Repeat last'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}