import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Star, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

interface AnimatedPlanSliderProps {
  onSelectPlan: (planId: string) => void;
  selectedPlan?: string;
}

export const AnimatedPlanSlider = ({ onSelectPlan, selectedPlan }: AnimatedPlanSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SUBSCRIPTION_PLANS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [autoPlay]);

  const nextPlan = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % SUBSCRIPTION_PLANS.length);
  };

  const prevPlan = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + SUBSCRIPTION_PLANS.length) % SUBSCRIPTION_PLANS.length);
  };

  const goToPlan = (index: number) => {
    setAutoPlay(false);
    setCurrentIndex(index);
  };

  const currentPlan = SUBSCRIPTION_PLANS[currentIndex];
  const isPopular = currentPlan.id === "premium";

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Plan Cards Container */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100/30 to-orange-100/30"></div>
        </div>

        {/* Popular Badge */}
        <AnimatePresence>
          {isPopular && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10"
            >
              <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full shadow-lg">
                <Star className="w-4 h-4 mr-1" />
                Most Popular
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="icon"
          onClick={prevPlan}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full shadow-md"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={nextPlan}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full shadow-md"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* Main Plan Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPlan.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -300, scale: 0.8 }}
            transition={{ 
              duration: 0.5, 
              ease: "easeInOut",
              scale: { duration: 0.3 }
            }}
            className="relative"
          >
            <Card className={`mx-auto max-w-md border-2 shadow-xl ${
              selectedPlan === currentPlan.id 
                ? 'border-primary ring-4 ring-primary/20' 
                : 'border-gray-200'
            } ${isPopular ? 'scale-105' : ''}`}>
              <CardHeader className="text-center relative">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {currentPlan.name}
                </CardTitle>
                <div className="flex items-center justify-center mt-4">
                  <span className="text-4xl font-bold text-primary">
                    {formatPrice(currentPlan.price)}
                  </span>
                  <span className="text-gray-600 ml-2">
                    /{currentPlan.duration} days
                  </span>
                </div>
                <p className="text-gray-600 mt-2 text-sm">
                  {currentPlan.description}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Plan Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="w-4 h-4 text-amber-600 mr-1" />
                      <span className="text-sm font-medium text-amber-800">Duration</span>
                    </div>
                    <span className="text-xl font-bold text-amber-900">
                      {currentPlan.duration} days
                    </span>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-sm font-medium text-green-800">Meals</span>
                    </div>
                    <span className="text-xl font-bold text-green-900">
                      {currentPlan.mealsPerMonth}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">What's Included:</h4>
                  {currentPlan.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center"
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                        feature.included 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {feature.included ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <span className="text-xs">×</span>
                        )}
                      </div>
                      <span className={feature.included ? 'text-gray-900' : 'text-gray-500'}>
                        {feature.text}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Weekly Meals Preview */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Sample Weekly Menu:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(currentPlan.weeklyMeals).slice(0, 3).map(([day, meal]: [string, any], index) => (
                      <motion.div
                        key={day}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex justify-between items-center p-2 bg-white rounded-lg border"
                      >
                        <span className="text-sm font-medium capitalize text-gray-700">
                          {day}
                        </span>
                        <span className="text-sm text-gray-600">
                          {meal.main}
                        </span>
                      </motion.div>
                    ))}
                    {Object.keys(currentPlan.weeklyMeals).length > 3 && (
                      <div className="text-center text-sm text-gray-500 pt-1">
                        +{Object.keys(currentPlan.weeklyMeals).length - 3} more days
                      </div>
                    )}
                  </div>
                </div>

                {/* Select Plan Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => onSelectPlan(currentPlan.id)}
                    className={`w-full py-3 text-lg font-semibold transition-all ${
                      selectedPlan === currentPlan.id
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                  >
                    {selectedPlan === currentPlan.id ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Selected
                      </>
                    ) : (
                      'Choose This Plan'
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Plan Indicators */}
        <div className="flex justify-center mt-6 space-x-2">
          {SUBSCRIPTION_PLANS.map((plan, index) => (
            <button
              key={plan.id}
              onClick={() => goToPlan(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-primary scale-125'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Plan Navigation Labels */}
        <div className="flex justify-center mt-4 space-x-8">
          {SUBSCRIPTION_PLANS.map((plan, index) => (
            <button
              key={plan.id}
              onClick={() => goToPlan(index)}
              className={`text-sm transition-all ${
                index === currentIndex
                  ? 'text-primary font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {plan.name}
            </button>
          ))}
        </div>

        {/* Auto-play Control */}
        <div className="flex justify-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoPlay(!autoPlay)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {autoPlay ? 'Pause Auto-Play' : 'Resume Auto-Play'}
          </Button>
        </div>
      </div>
    </div>
  );
};