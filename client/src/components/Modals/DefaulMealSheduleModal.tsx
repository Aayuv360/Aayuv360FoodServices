import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { X, Calendar, Clock, ChefHat } from "lucide-react";

export const DefaulMealSheduleModal = ({
  currentPlan,
  form,
  defaulMealModalOpen,
  setDefaulMealModalOpen,
}: any) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Dialog open={defaulMealModalOpen} onOpenChange={setDefaulMealModalOpen}>
        <DialogContent className="sm:max-w-full h-full max-h-screen overflow-hidden p-0 gap-0">
          {/* Mobile Header */}
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Default Meal Plan</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDefaulMealModalOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-y-auto p-4 pb-20">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">
                  {currentPlan?.duration} days meal schedule
                </span>
              </div>
              <Badge
                variant="outline"
                className={
                  form.watch("dietaryPreference") === "veg"
                    ? "bg-green-100 text-green-800"
                    : form.watch("dietaryPreference") === "veg_with_egg"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                }
              >
                {form.watch("dietaryPreference") === "veg"
                  ? "🌿 Vegetarian"
                  : form.watch("dietaryPreference") === "veg_with_egg"
                    ? "🥚 Veg with Egg"
                    : "🍗 Non-Vegetarian"}
              </Badge>
            </div>

            <div className="space-y-3">
              {currentPlan?.menuItems &&
                Array.from({
                  length: Math.min(currentPlan?.duration, 30),
                }).map((_, index) => {
                  const startDate = new Date(form.watch("startDate"));
                  const mealDate = new Date(startDate);
                  mealDate.setDate(startDate.getDate() + index);
                  const formattedDate = format(mealDate, "MMM d");

                  const dayIndex = index % currentPlan.menuItems.length;
                  const meals = currentPlan.menuItems[dayIndex];

                  const curryType =
                    form.watch("dietaryPreference") === "veg"
                      ? "Vegetable curry"
                      : form.watch("dietaryPreference") === "veg_with_egg"
                        ? "Egg curry"
                        : "Chicken curry";

                  return (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {index + 1}
                            </span>
                          </div>
                          {/* <span className="font-medium text-sm">
                            Day {index + 1}
                          </span> */}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">{formattedDate}</span>
                        </div>
                      </div>

                      <div className="bg-orange-50 rounded-lg p-3">
                        <h4 className="font-semibold text-primary mb-1">
                          {meals?.main}
                        </h4>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Served with:</span>{" "}
                          {curryType}
                        </p>
                        {meals?.sides && meals.sides.length > 0 && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Sides:</span>{" "}
                            {meals.sides.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="sticky bottom-0 bg-white border-t p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDefaulMealModalOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop Modal
  return (
    <Dialog open={defaulMealModalOpen} onOpenChange={setDefaulMealModalOpen}>
      <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            Default Meal Plan
          </DialogTitle>
          <DialogDescription>
            Your personalized meal schedule for {currentPlan?.duration} days
          </DialogDescription>
        </DialogHeader>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  Meal Schedule ({currentPlan?.duration} days)
                </span>
              </div>
              <Badge
                variant="outline"
                className={
                  form.watch("dietaryPreference") === "veg"
                    ? "bg-green-100 text-green-800"
                    : form.watch("dietaryPreference") === "veg_with_egg"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                }
              >
                {form.watch("dietaryPreference") === "veg"
                  ? "🌿 Vegetarian"
                  : form.watch("dietaryPreference") === "veg_with_egg"
                    ? "🥚 Veg with Egg"
                    : "🍗 Non-Vegetarian"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
            {currentPlan?.menuItems &&
              Array.from({
                length: Math.min(currentPlan?.duration, 30),
              }).map((_, index) => {
                const startDate = new Date(form.watch("startDate"));
                const mealDate = new Date(startDate);
                mealDate.setDate(startDate.getDate() + index);
                const formattedDate = format(mealDate, "MMM d");

                const dayIndex = index % currentPlan.menuItems.length;
                const meals = currentPlan.menuItems[dayIndex];

                const curryType =
                  form.watch("dietaryPreference") === "veg"
                    ? "Vegetable curry"
                    : form.watch("dietaryPreference") === "veg_with_egg"
                      ? "Egg curry"
                      : "Chicken curry";

                return (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 rounded-full w-7 h-7 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {index + 1}
                          </span>
                        </div>
                        {/* <span className="font-medium text-sm">
                          Day {index + 1}
                        </span> */}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">{formattedDate}</span>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-3">
                      <h4 className="font-semibold text-primary mb-1 text-sm">
                        {meals?.main}
                      </h4>
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="font-medium">With:</span> {curryType}
                      </p>
                      {meals?.sides && meals.sides.length > 0 && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Sides:</span>{" "}
                          {meals.sides.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDefaulMealModalOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
