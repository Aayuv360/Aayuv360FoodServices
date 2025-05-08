import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const CustomMealSheduleModal = ({
  mealsLoading,
  currentPlan,
  form,
  getDayName,
  selectedDate,
  setSelectedDate,
  mealOptionsByDay,
  selectedMealsByDay,
  setSelectedMealsByDay,
  updateMealSelection,
  meals,
  customMealModalOpen,
  setCustomMealModalOpen,
}: any) => {
  return (
    <>
      <Dialog open={customMealModalOpen} onOpenChange={setCustomMealModalOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Custom Meal Plan</DialogTitle>
            {/* <DialogDescription>
              Search for your location on the map or enter address details
              manually.
            </DialogDescription> */}
          </DialogHeader>
          <div className="border-t pt-6 mb-2">
            <h3 className="text-lg font-semibold mb-4">
              Customize Your Weekly Meal Plan
            </h3>
            {mealsLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      Select a day to customize your meal (Plan duration:{" "}
                      {currentPlan.duration} days):
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Array.from({
                        length: Math.min(currentPlan.duration, 30),
                      }).map((_, index) => {
                        const startDate = new Date(form.watch("startDate"));
                        const mealDate = new Date(startDate);
                        mealDate.setDate(startDate.getDate() + index);
                        const dayOfWeek = mealDate.getDay();
                        const dayName = getDayName(dayOfWeek);
                        const formattedDate = format(mealDate, "d");

                        return (
                          <Button
                            key={index}
                            type="button"
                            variant={
                              selectedDate &&
                              selectedDate.getDate() === mealDate.getDate() &&
                              selectedDate.getMonth() === mealDate.getMonth()
                                ? "default"
                                : "outline"
                            }
                            onClick={() => {
                              setSelectedDate(mealDate);
                            }}
                            className="flex-1"
                          >
                            <span className="text-xs">Day {index + 1}</span>
                            <span className="block text-xs">
                              {dayName} {formattedDate}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Meal selection */}
                  {selectedDate && (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        Select a meal for {getDayName(selectedDate.getDay())}:
                      </p>
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                        {mealOptionsByDay[selectedDate.getDay()]?.map(
                          (meal: any) => (
                            <Card
                              key={meal.id}
                              className={`cursor-pointer transition-all ${
                                selectedMealsByDay[selectedDate.getDay()] ===
                                meal.id
                                  ? "border-primary"
                                  : ""
                              }`}
                              onClick={() =>
                                updateMealSelection(
                                  selectedDate.getDay(),
                                  meal.id,
                                )
                              }
                            >
                              <div className="flex items-center p-2">
                                <div className="w-16 h-16 rounded-md overflow-hidden mr-3 flex-shrink-0">
                                  <img
                                    src={
                                      meal.image ||
                                      "https://via.placeholder.com/150?text=Millet+Meal"
                                    }
                                    alt={meal.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">
                                    {meal.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 line-clamp-2">
                                    {meal.description}
                                  </p>
                                  <div className="flex gap-1 mt-1">
                                    {meal.dietaryPreferences?.map(
                                      (pref: string) => (
                                        <Badge
                                          key={pref}
                                          variant="outline"
                                          className="text-xs px-1 py-0"
                                        >
                                          {pref}
                                        </Badge>
                                      ),
                                    )}
                                  </div>
                                </div>
                                {selectedMealsByDay[selectedDate.getDay()] ===
                                  meal.id && (
                                  <Check className="h-5 w-5 text-primary ml-2" />
                                )}
                              </div>
                            </Card>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-3">Your Selected Meals</h4>
                  {Object.keys(selectedMealsByDay).length > 0 ? (
                    <ul className="space-y-2">
                      {Object.entries(selectedMealsByDay).map(
                        ([day, mealId]) => {
                          const selectedMeal = meals?.find(
                            (m: any) => m.id === mealId,
                          );
                          return (
                            <li
                              key={day}
                              className="flex justify-between items-center p-2 bg-neutral-light rounded-lg"
                            >
                              <div>
                                <span className="font-medium">
                                  {getDayName(parseInt(day))}
                                </span>
                                <p className="text-sm">{selectedMeal?.name}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMealsByDay((prev: any) => {
                                    const newState = { ...prev };
                                    delete newState[parseInt(day)];
                                    return newState;
                                  });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No meals selected yet. Select a day and choose your meal.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>{" "}
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomMealModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
