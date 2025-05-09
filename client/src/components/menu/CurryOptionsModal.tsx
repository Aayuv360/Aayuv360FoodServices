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
}

export function CurryOptionsModal({
  open,
  onClose,
  meal,
  onAddToCart,
}: CurryOptionsModalProps) {
  // Define curry options for this meal
  const curryOptions: CurryOption[] = [
    { id: "regular", name: "Regular Curry", priceAdjustment: 0 },
    { id: "spicy", name: "Spicy Curry", priceAdjustment: 2500 },
    { id: "extra-spicy", name: "Extra Spicy Curry", priceAdjustment: 3500 },
    { id: "butter", name: "Butter Curry", priceAdjustment: 5000 },
    { id: "garlic", name: "Garlic Curry", priceAdjustment: 4000 },
  ];

  const [selectedOption, setSelectedOption] = useState<string>(curryOptions[0].id);

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${(price / 100).toFixed(2)}`;
  };

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
            <DialogTitle>Customize Your Meal</DialogTitle>
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
                className="flex items-center justify-between space-x-2 rounded-md border p-3"
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
            Add to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}