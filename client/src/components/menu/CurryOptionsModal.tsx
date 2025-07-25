import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Meal } from "@shared/schema";
import { formatPrice } from "@/lib/utils";

interface CurryOption {
  id: string;
  name: string;
  priceAdjustment: number;
}

interface CurryOptionsModalProps {
  open: boolean;
  onClose: () => void;
  meal: Meal;
  onAddToCart: (meal: Meal, selectedCurryOption: any) => void;
  lastCurryOption?: CurryOption;
  isInCart?: boolean;
}

export function CurryOptionsModal({
  open,
  onClose,
  meal,
  onAddToCart,
  lastCurryOption,
  isInCart = false,
}: CurryOptionsModalProps) {
  const curryOptions: CurryOption[] = meal.curryOptions
    ? meal.curryOptions.map((option: any) => {
        if (Array.isArray(option)) {
          return {
            id: option[0],
            name: option[1],
            priceAdjustment: option[2],
          };
        } else {
          return {
            id: option.id,
            name: option.name,
            priceAdjustment: option.price || option.priceAdjustment || 0,
          };
        }
      })
    : [];

  const defaultSelectedOption = lastCurryOption
    ? lastCurryOption.id
    : curryOptions.length > 0
      ? curryOptions[0].id
      : "regular";
  const [selectedOption, setSelectedOption] = useState<string>(
    defaultSelectedOption,
  );

  const handleAddToCart = () => {
    const selectedCurryOption = curryOptions.find(
      (option) => option.id === selectedOption,
    );

    if (selectedCurryOption) {
      onAddToCart(meal, selectedCurryOption);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-4 sm:p-6 max-h-[90vh] overflow-auto">
        <DialogHeader className="pb-2 sm:pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base sm:text-lg">
              {isInCart ? "Update Your Customization" : "Customize Your Meal"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm mt-1">
            Choose a curry style for {meal.name}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
          <RadioGroup
            defaultValue={selectedOption}
            onValueChange={setSelectedOption}
            className="space-y-1.5 sm:space-y-2"
          >
            {curryOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center justify-between space-x-2 rounded-md border p-2 sm:p-3 ${
                  lastCurryOption && option.id === lastCurryOption.id
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  />
                  <Label
                    htmlFor={option.id}
                    className="cursor-pointer text-xs sm:text-sm"
                  >
                    {option.name}
                  </Label>
                </div>
                <div className="text-xs sm:text-sm font-medium">
                  {option.priceAdjustment > 0 && (
                    <span className="text-primary">
                      +{formatPrice(option.priceAdjustment)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>

          <Button
            onClick={handleAddToCart}
            className="w-full text-xs sm:text-sm h-auto py-1.5 sm:py-2 mt-2"
          >
            {isInCart ? "Update Selection" : "Add to Cart"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
