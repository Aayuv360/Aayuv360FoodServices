import React from "react";
import { useLocation } from "wouter";
import { CheckIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  price: number;
  featured: boolean;
  mealsPerMonth: number;
  features: {
    text: string;
    included: boolean;
  }[];
}

const SubscriptionPlans = () => {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const plans: Plan[] = [
    {
      id: "basic",
      name: "Basic Plan",
      price: 2999,
      featured: false,
      mealsPerMonth: 12,
      features: [
        { text: "12 meals per month", included: true },
        { text: "Flexible delivery schedule", included: true },
        { text: "Basic customization options", included: true },
        { text: "Nutrition consultation", included: false },
      ],
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: 4999,
      featured: true,
      mealsPerMonth: 20,
      features: [
        { text: "20 meals per month", included: true },
        { text: "Priority delivery slots", included: true },
        { text: "Full customization options", included: true },
        { text: "Monthly nutrition consultation", included: true },
      ],
    },
    {
      id: "family",
      name: "Family Plan",
      price: 8999,
      featured: false,
      mealsPerMonth: 40,
      features: [
        { text: "40 meals per month", included: true },
        { text: "Preferred delivery window", included: true },
        { text: "Full customization with family portions", included: true },
        { text: "Bi-weekly nutrition consultation", included: true },
      ],
    },
  ];

  const handleSelectPlan = (plan: Plan) => {
    // if (!user) {
    //   toast({
    //     title: "Please login",
    //     description: "You need to be logged in to select a subscription plan",
    //     variant: "destructive",
    //   });
    //   navigate("/login");
    //   return;
    // }

    navigate(`/subscription?plan=${plan.id}`);
  };

  return (
    <section id="plans" className="bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Subscription Plans</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan that suits your needs and lifestyle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`${
                plan.featured
                  ? "bg-white border-2 border-primary transform scale-103 z-10"
                  : "bg-neutral-light"
              } rounded-lg overflow-hidden card-shadow transition-transform hover:scale-103 relative`}
            >
              {plan.featured && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-accent py-1 px-3 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-accent font-semibold text-primary mb-4">
                  ₹{plan.price}
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <p className="text-gray-600 mb-6">
                  {plan.id === "basic"
                    ? "Perfect for individuals looking to try our millet meals."
                    : plan.id === "premium"
                      ? "Ideal for regular healthy eating with greater variety."
                      : "Complete solution for families seeking healthy millet meals."}
                </p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      {feature.included ? (
                        <CheckIcon className="h-5 w-5 text-success mr-2 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      )}
                      <span className={feature.included ? "" : "text-gray-400"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-white h-10 text-base"
                  onClick={() => handleSelectPlan(plan)}
                >
                  Select Plan
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlans;
