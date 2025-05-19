import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface SubscriptionPaymentStepProps {
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;
  planPrice: number;
}

const SubscriptionPaymentStep: React.FC<SubscriptionPaymentStepProps> = ({
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  planPrice,
}) => {
  return (
    <div className="flex-grow overflow-y-auto p-4 sm:p-6">
      <h3 className="font-medium mb-4">Payment Method</h3>

      <RadioGroup
        value={selectedPaymentMethod}
        onValueChange={setSelectedPaymentMethod}
        className="space-y-4"
      >
        <div className="flex items-start space-x-2 border rounded-md p-3 hover:border-primary transition-colors">
          <RadioGroupItem value="razorpay" id="payment-razorpay" />
          <div className="flex-1">
            <Label
              htmlFor="payment-razorpay"
              className="flex items-center cursor-pointer"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Credit/Debit Card or UPI
            </Label>
            <p className="text-xs text-gray-500 mt-1">
              Safe payment with Razorpay
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-2 border rounded-md p-3 hover:border-primary transition-colors">
          <RadioGroupItem value="cod" id="payment-cod" />
          <div className="flex-1">
            <Label htmlFor="payment-cod" className="cursor-pointer">
              Cash on Delivery for First Order
            </Label>
            <p className="text-xs text-gray-500 mt-1">
              Pay when you receive your first order
            </p>
          </div>
        </div>
      </RadioGroup>

      <div className="mt-6 space-y-3">
        <h4 className="font-medium text-sm">Subscription Summary</h4>
        <div className="flex justify-between text-sm">
          <span>Monthly Subscription</span>
          <span>{formatPrice(planPrice)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Setup Fee</span>
          <span>{formatPrice(0)}</span>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between font-medium">
          <span>Total Due Today</span>
          <span>{formatPrice(planPrice)}</span>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-md text-xs text-gray-600">
          <p>You'll be charged {formatPrice(planPrice)} monthly for this subscription plan. You can cancel anytime from your account page.</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPaymentStep;