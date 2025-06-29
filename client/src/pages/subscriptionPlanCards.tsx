import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

const plansEmoji = [
  {
    id: "basic",
    name: "Basic",
    emoji: "🌱",
  },
  {
    id: "premium",
    name: "Premium",
    emoji: "🌾",
  },
  {
    id: "family",
    name: "Family",
    emoji: "👑",
  },
];

export function SubscriptionPlanCards({
  filteredPlans,
  selectedPlan,
  setSelectedPlan,
  isMobile,
  setDefaulMealModalOpen,
}: any) {
  const renderCard = (plan: any, isSelected: boolean) => (
    <Card
      key={plan?.id}
      className={`rounded-2xl cursor-pointer transition-transform hover:-translate-y-1 border-2 shadow-md bg-white ${
        isSelected
          ? "border-primary"
          : "border-gray-200 hover:border-primary/50"
      }`}
      onClick={() => setSelectedPlan(plan)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center w-full">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <span>
              {plansEmoji.find((item) => item.name === plan?.name)?.emoji}
            </span>
            <span>{plan?.name === "Family" ? "Elite" : plan?.name}</span>
          </CardTitle>

          {isSelected && (
            <div className="flex items-center space-x-2 ml-auto">
              <span
                role="button"
                className="text-primary hover:underline cursor-pointer font-medium text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDefaulMealModalOpen(true);
                }}
              >
                Meal info
              </span>
              <Check className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
        <CardDescription className="text-sm text-gray-600">
          {plan?.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold text-primary">
            {formatPrice(plan?.price)}
            <span className="text-sm font-normal text-gray-600 ml-1">
              /month
            </span>
          </div>

          <div className="space-y-2">
            {plan?.features.map((feature: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className="py-4 overflow-hidden">
      {isMobile ? (
        <div className="relative flex flex-col items-center w-full overflow-hidden">
          <div className="absolute top-0 w-full flex justify-center gap-4 pointer-events-none z-10">
            {filteredPlans
              .filter((p: any) => p.planType !== selectedPlan?.planType)
              .map((p: any) => (
                <div className="pointer-events-auto max-w-[360px]" key={p.id}>
                  {renderCard(p, false)}
                </div>
              ))}
          </div>
          <div className="relative z-30 mt-[120px] max-w-[360px] w-full">
            {renderCard(selectedPlan, true)}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {filteredPlans.map((plan: any) =>
            renderCard(plan, selectedPlan?.planType === plan.planType),
          )}
        </div>
      )}
    </section>
  );
}
