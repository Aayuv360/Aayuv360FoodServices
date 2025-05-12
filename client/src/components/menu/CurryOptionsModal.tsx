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
  onAddToCart: (meal: Meal & { curryOption: CurryOption }) => void;
  lastCurryOption?: CurryOption;
  isInCart?: boolean;
}

export function CurryOptionsModal({
  open,
  onClose,
  meal,
  onAddToCart,
  lastCurryOption,
  isInCart = false
}: CurryOptionsModalProps) {
  // Extract curry options from the meal (convert from array format to object format)
  const curryOptions: CurryOption[] = meal.curryOptions ? 
    meal.curryOptions.map((option: any) => ({
      id: option[0],
      name: option[1],
      priceAdjustment: option[2]
    })) : 
    // Fallback to default options if none are provided in the meal
    [
      { id: "regular", name: "Regular Curry", priceAdjustment: 0 },
      { id: "spicy", name: "Spicy Curry", priceAdjustment: 25 },
      { id: "extra-spicy", name: "Extra Spicy Curry", priceAdjustment: 35 },
      { id: "butter", name: "Butter Curry", priceAdjustment: 50 },
      { id: "garlic", name: "Garlic Curry", priceAdjustment: 40 },
    ];

  // If the user has a last selected curry option, use that as default; otherwise use the first option
  // Make sure curryOptions is not empty before accessing the first element
  const defaultSelectedOption = lastCurryOption ? 
    lastCurryOption.id : 
    (curryOptions.length > 0 ? curryOptions[0].id : "regular");
  const [selectedOption, setSelectedOption] = useState<string>(defaultSelectedOption);

  // Using imported formatPrice function from utils

  const handleAddToCart = () => {
    const selectedCurryOption = curryOptions.find(
      (option) => option.id === selectedOption
    );

    if (selectedCurryOption) {
      onAddToCart({
        ...meal,
        curryOption: selectedCurryOption,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{isInCart ? 'Update Your Customization' : 'Customize Your Meal'}</DialogTitle>
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
            Choose a curry style for {meal.name}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <RadioGroup
            defaultValue={selectedOption}
            onValueChange={setSelectedOption}
            className="space-y-2"
          >
            {curryOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center justify-between space-x-2 rounded-md border p-3 ${
                  lastCurryOption && option.id === lastCurryOption.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="cursor-pointer">
                    {option.name}
                  </Label>
                </div>
                <div className="text-sm font-medium">
                  {option.priceAdjustment > 0 ? (
                    <span className="text-primary">
                      +{formatPrice(option.priceAdjustment)}
                    </span>
                  ) : (
                    <span>Included</span>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>

          <Button 
            onClick={handleAddToCart} 
            className="w-full"
          >
            {isInCart ? 'Update Selection' : 'Add to Cart'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}