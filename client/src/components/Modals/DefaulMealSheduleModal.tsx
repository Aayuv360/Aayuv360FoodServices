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

export const DefaulMealSheduleModal = ({
  currentPlan,
  form,
  defaulMealModalOpen,
  setDefaulMealModalOpen,
}: any) => {
  return (
    <>
      <Dialog open={defaulMealModalOpen} onOpenChange={setDefaulMealModalOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Default Meal Plan</DialogTitle>
          </DialogHeader>
          <div className="border-t pt-6 mb-2">
            <h4 className="font-medium text-sm mb-2">
              Meal Schedule ({currentPlan?.duration} days)
            </h4>
            <div className="flex flex-wrap gap-3 max-h-72 overflow-y-auto pr-2">
              {currentPlan?.menuItems &&
                Array.from({
                  length: Math.min(currentPlan?.duration, 30),
                }).map((_, index) => {
                  const startDate = new Date(form.watch("startDate"));
                  const mealDate = new Date(startDate);
                  mealDate.setDate(startDate.getDate() + index);
                  const formattedDate = format(mealDate, "MMM d");
                  
                  // Get the meal for this day using modulo to cycle through menuItems
                  const dayIndex = index % currentPlan.menuItems.length;
                  const meals = currentPlan.menuItems[dayIndex];

                  const curryType =
                    form.watch("dietaryPreference") === "vegetarian"
                      ? "Vegetable curry"
                      : form.watch("dietaryPreference") === "veg-with-egg"
                        ? "Egg curry"
                        : "Chicken curry";

                  return (
                    <div
                      key={index}
                      className="bg-white p-2 rounded border w-64"
                    >
                      <p className="font-medium capitalize flex justify-between">
                        <span>
                          Day {index + 1}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {formattedDate}
                        </span>
                      </p>
                      <div className="mt-1">
                        <p className="text-sm font-medium">{meals?.main}</p>
                        <p className="text-xs text-gray-600">
                          With: {curryType}, {meals?.sides?.join(", ")}
                        </p>
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
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
