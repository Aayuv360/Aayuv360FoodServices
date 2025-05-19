import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useLocation } from "wouter";

interface SubscriptionSuccessStepProps {
  subscriptionId: number | null;
  plan: any;
  selectedPaymentMethod: string;
}

const SubscriptionSuccessStep: React.FC<SubscriptionSuccessStepProps> = ({
  subscriptionId,
  plan,
  selectedPaymentMethod,
}) => {
  const [, navigate] = useLocation();

  return (
    <div className="flex-grow overflow-y-auto p-4 sm:p-6 text-center">
      <div className="mb-4 mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-green-100">
        <Check className="w-10 h-10 text-green-600" />
      </div>
      <h3 className="text-xl font-bold">Thank You!</h3>
      <p className="text-gray-600 mt-2">
        Your subscription has been activated successfully
      </p>

      <div className="mt-6 p-4 border rounded-md text-left">
        <h4 className="font-medium mb-2">Subscription Details</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-gray-600">Subscription ID:</span>
          <span>#{subscriptionId}</span>
          <span className="text-gray-600">Plan:</span>
          <span>{plan?.name}</span>
          <span className="text-gray-600">Price:</span>
          <span>{formatPrice(plan?.price || 0)}/month</span>
          <span className="text-gray-600">Payment Method:</span>
          <span>
            {selectedPaymentMethod === "razorpay"
              ? "Online Payment"
              : "Cash on Delivery"}
          </span>
          <span className="text-gray-600">Status:</span>
          <span className="text-green-600 font-medium">Active</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Button
          className="w-full"
          onClick={() => navigate(`/profile?tab=subscriptions`)}
        >
          View My Subscriptions
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/meal-planner")}
        >
          Plan My Meals
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionSuccessStep;