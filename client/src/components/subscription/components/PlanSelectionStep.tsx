import React from "react";
import { useLocation } from "wouter";
import { Check, ShoppingCart as ShoppingCartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface PlanSelectionStepProps {
  plan: any;
  onClose: () => void;
}

const PlanSelectionStep: React.FC<PlanSelectionStepProps> = ({
  plan,
  onClose,
}) => {
  const [, navigate] = useLocation();

  if (!plan) {
    return (
      <div className="text-center py-6 sm:py-8 px-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4">
          <ShoppingCartIcon className="w-full h-full" />
        </div>
        <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">
          No subscription plan selected
        </p>
        <Button
          onClick={() => {
            navigate("/subscription");
            onClose();
          }}
          className="text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
        >
          Browse Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto">
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
          <div className="mt-2">
            <Badge className="bg-primary/10 text-primary">
              {plan.type || "Monthly"}
            </Badge>
            <Badge className="ml-2 bg-primary/10 text-primary">
              {plan.mealsPerMonth || 30} meals
            </Badge>
          </div>
          <div className="mt-3 text-xl font-bold">
            {formatPrice(plan.price)}
            <span className="text-sm font-normal text-gray-500">/month</span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Plan Benefits:</h4>
          <ul className="space-y-2 text-sm">
            {plan.features?.map((feature: string, index: number) => (
              <li key={index} className="flex">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>{feature}</span>
              </li>
            )) || (
              <>
                <li className="flex">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Free delivery on all orders</span>
                </li>
                <li className="flex">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Healthy, nutritious millet meals</span>
                </li>
                <li className="flex">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Customizable meal selections</span>
                </li>
                <li className="flex">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>Cancel anytime, no penalties</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlanSelectionStep;