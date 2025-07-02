import React from "react";
import { Utensils, CheckCircle2, Truck } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Choose Your Plan",
    description:
      "Select a meal plan that fits your lifestyle, dietary needs, and preferences.",
    icon: CheckCircle2,
    color: "from-orange-500 to-amber-500",
  },
  {
    id: 2,
    title: "Customize Your Meals",
    description:
      "Pick your favorite dishes from our rotating menu of 30 millet-based options.",
    icon: Utensils,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: 3,
    title: "Enjoy Fresh Delivery",
    description:
      "We prepare and deliver your meals fresh to your doorstep on your schedule.",
    icon: Truck,
    color: "from-orange-400 to-amber-400",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-10 relative overflow-hidden">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 mb-1">
            How Our Service Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-m">
            We make healthy eating simple and delicious with our easy-to-use
            subscription service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-3 gap-12 max-w-5xl mx-auto perspective-2000">
          {steps.map((step, index) => {
            const IconComponent = step.icon;

            return (
              <div
                key={step.id}
                className="group relative"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-2xl transform -rotate-6 transition-transform duration-300 group-hover:rotate-3"></div>
                <div className="relative bg-white rounded-2xl p-8 shadow-card-3d hover:shadow-hover-3d transition-all duration-500 transform hover:-translate-y-2 hover:translate-z-12">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center mb-2 transform transition-transform duration-300 group-hover:scale-110`}
                  >
                    <IconComponent size={32} className="text-white" />
                  </div>

                  <h3 className="text-lg font-semibold mb-1 text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-gray-900 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
