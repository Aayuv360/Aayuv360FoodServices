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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{isInCart ? 'Update your customization?' : 'Repeat previous customization?'}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {isInCart 
              ? `How would you like to update ${meal.name} in your cart?` 
              : `How would you like to add ${meal.name} to your cart?`}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {lastCurryOption && (
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-medium mb-1">Last Selection</h3>
              <p className="text-sm text-gray-600">
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

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={onChooseNew}
              variant="outline"
              className="w-full"
            >
              I'll choose
            </Button>
            <Button
              onClick={onRepeatLast}
              variant="default"
              className="w-full"
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