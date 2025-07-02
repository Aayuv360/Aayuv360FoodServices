import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

interface Plan {
  id: string;
  name: string;
  price: number;
  featured: boolean;
  features: {
    text: string;
    included: boolean;
  }[];
  planType: string;
}

const SubscriptionPlans = ({ previousPlansData }: any) => {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: apiPlans, isLoading } = useQuery({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await fetch("/api/subscription-plans");
      if (!res.ok) {
        throw new Error("Failed to fetch subscription plans");
      }
      return await res.json();
    },
  });

  const plans: Plan[] = apiPlans
    ? (() => {
        const vegGroup = apiPlans.find(
          (group: any) => group.dietaryPreference === "veg"
        );
        return (
          vegGroup?.plans?.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            price: plan.price,
            featured: plan.planType === "premium",
            planType: plan.planType,
            features:
              plan.features?.map((feature: string) => ({
                text: feature,
                included: true,
              })) || [],
          })) || []
        );
      })()
    : [];

  const sortedPlans: Plan[] = [
    plans.find((p) => p.planType === "basic"),
    plans.find((p) => p.planType === "premium"),
    plans.find((p) => p.planType === "family"),
  ].filter(Boolean) as Plan[];

  const handleSelectPlan = (plan: Plan) => {
    navigate(`/subscription?plan=${plan.planType}`);
  };

  if (isLoading) {
    return (
      <section className="bg-white">
        <div className="container mx-auto px-4 text-center py-16">
          <h2 className="text-3xl font-bold mb-4">Subscription Plans</h2>
          <p className="text-lg text-gray-600">Loading subscription plans...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 md:pb-12 md:pt-0 perspective-2000">
      <div className="container mx-auto">
        <div className="text-center transform transition-all duration-700 hover:translate-z-12 mb-4 md:mb-8">
          <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
            Subscription Plans
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base">
            Choose the perfect plan that suits your needs and lifestyle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {sortedPlans.map((plan) => (
            <div
              key={plan.id}
              className={`group perspective-1000 ${plan.featured ? "md:scale-105" : ""}`}
            >
              <div
                className={`relative bg-white border rounded-xl overflow-hidden transition-all duration-500 transform hover:translate-z-12 ${
                  hoveredPlan === plan.id ? "rotate-y-2 translate-y-[-8px]" : ""
                } ${
                  plan.featured
                    ? "border-orange-500 shadow-xl"
                    : "border-gray-200 shadow-lg hover:shadow-xl"
                }`}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {plan.featured && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>
                )}

                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-1 text-gray-900">
                    {plan.name === "Family" ? "Elite" : plan.name}
                  </h3>
                  <div className="flex items-baseline mb-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                      ₹{plan.price}
                    </span>
                    <span className="text-gray-900 text-sm ml-1">/month</span>
                  </div>
                  <p className="text-gray-900 text-sm mb-4">
                    {plan.id === "basic"
                      ? "Perfect for individuals looking to try our millet meals."
                      : plan.id === "premium"
                        ? "Ideal for regular healthy eating with greater variety."
                        : "Complete solution for families seeking healthy millet meals."}
                  </p>

                  <ul className="space-y-1 mb-6">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-start group">
                        <div className="rounded-full p-1 bg-green-100 text-green-500 mr-2 mt-0.5 flex-shrink-0 transform transition-transform duration-300 group-hover:scale-110">
                          {feature.included ? (
                            <Check size={14} />
                          ) : (
                            <X size={14} className="text-gray-400" />
                          )}
                        </div>
                        <span
                          className={`text-gray-900 text-sm ${!feature.included ? "line-through text-gray-400" : ""}`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full py-3 rounded-lg font-medium transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg ${
                      plan.featured
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600"
                        : "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 hover:from-orange-100 hover:to-amber-100"
                    }`}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    Select Plan
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlans;
