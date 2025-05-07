import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Meal } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

interface CurryOptionType {
  id: string;
  name: string;
  description: string;
  priceAdjustment: number;
}

interface CurryOptionsModalProps {
  meal: Meal;
  open: boolean;
  onClose: () => void;
}

const curryOptions: CurryOptionType[] = [
  {
    id: "veg",
    name: "Vegetarian Curry",
    description: "Traditional vegetarian curry made with seasonal vegetables",
    priceAdjustment: 0, // No additional charge
  },
  {
    id: "nonveg",
    name: "Non-Vegetarian Curry",
    description: "Premium non-vegetarian curry with chicken or mutton",
    priceAdjustment: 8000, // ₹80 additional charge
  }
];

const CurryOptionsModal = ({ meal, open, onClose }: CurryOptionsModalProps) => {
  const [selectedOption, setSelectedOption] = useState<string>("veg");
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    const option = curryOptions.find(opt => opt.id === selectedOption);
    if (!option) return;
    
    // Create modified meal with curry option
    const modifiedMeal = {
      ...meal,
      price: meal.price + option.priceAdjustment,
      name: `${meal.name} with ${option.name}`,
      curryOption: option.id
    };
    
    // Add to cart
    addToCart(modifiedMeal);
    
    toast({
      title: "Added to cart",
      description: `${modifiedMeal.name} has been added to your cart`,
      variant: "default",
    });
    
    onClose();
  };

  const getAdjustedPrice = () => {
    const option = curryOptions.find(opt => opt.id === selectedOption);
    const adjustedPrice = meal.price + (option?.priceAdjustment || 0);
    return `₹${(adjustedPrice / 100).toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Curry Options for {meal.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
            {curryOptions.map((option) => (
              <div key={option.id} className="flex items-start space-x-2 mb-4 border p-3 rounded-lg hover:border-primary cursor-pointer" onClick={() => setSelectedOption(option.id)}>
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={option.id} className="font-medium cursor-pointer">{option.name}</Label>
                  <p className="text-sm text-gray-500">{option.description}</p>
                  {option.priceAdjustment > 0 && (
                    <p className="text-sm text-primary mt-1">+₹{(option.priceAdjustment / 100).toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter className="flex justify-between items-center">
          <div className="font-semibold">{getAdjustedPrice()}</div>
          <Button type="button" onClick={handleAddToCart}>
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CurryOptionsModal;