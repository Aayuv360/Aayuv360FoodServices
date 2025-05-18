import { Loader2, Check, X, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

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
  const [localSelectedMeals, setLocalSelectedMeals] =
    useState(selectedMealsByDay);

  useEffect(() => {
    setLocalSelectedMeals(selectedMealsByDay);
  }, [selectedMealsByDay]);

  const localUpdateMealSelection = (dayOfWeek: number, mealId: number) => {
    setLocalSelectedMeals((prev: any) => ({
      ...prev,
      [dayOfWeek]: mealId,
    }));
  };

  const saveSelections = () => {
    Object.entries(localSelectedMeals).forEach(([day, mealId]) => {
      updateMealSelection(parseInt(day), mealId as number);
    });

    setCustomMealModalOpen(false);
  };

  return (
    <>
      <Dialog open={customMealModalOpen} onOpenChange={setCustomMealModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" /> Custom Meal Plan
            </DialogTitle>
          </DialogHeader>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Customize Your Weekly Meal Plan
              </h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Info className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>
                      Select meals for specific days to create your custom plan.
                      Your choices will be saved when you click "Save
                      Selections".
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {mealsLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-neutral-50 p-4 rounded-lg border">
                    <h4 className="font-medium text-sm mb-3 flex items-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">
                        1
                      </span>
                      Select a day ({currentPlan.duration || 30} day plan)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({
                        length: Math.min(currentPlan.duration || 30, 30),
                      }).map((_, index) => {
                        const startDate = new Date(form.watch("startDate"));
                        const mealDate = addDays(startDate, index);
                        const dayOfWeek = mealDate.getDay();
                        const dayName = getDayName(dayOfWeek);
                        const formattedDate = format(mealDate, "d");

                        const hasMeal =
                          localSelectedMeals[dayOfWeek] !== undefined;

                        return (
                          <Button
                            key={index}
                            type="button"
                            variant={
                              selectedDate &&
                              selectedDate.getDate() === mealDate.getDate() &&
                              selectedDate.getMonth() === mealDate.getMonth()
                                ? "default"
                                : hasMeal
                                  ? "secondary"
                                  : "outline"
                            }
                            onClick={() => {
                              setSelectedDate(mealDate);
                            }}
                            className={`w-[calc(25%-6px)] h-auto py-2 ${
                              hasMeal ? "ring-1 ring-primary/30" : ""
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-semibold">
                                Day {index + 1}
                              </span>
                              <span className="text-xs">
                                {dayName.substring(0, 3)} {formattedDate}
                              </span>
                              {hasMeal && <Check className="h-3 w-3 mt-1" />}
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedDate && (
                    <div className="bg-neutral-50 p-4 rounded-lg border">
                      <h4 className="font-medium text-sm mb-3 flex items-center">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">
                          2
                        </span>
                        Select a meal for {getDayName(selectedDate.getDay())}
                      </h4>
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                        {mealOptionsByDay[selectedDate.getDay()]?.map(
                          (meal: any) => (
                            <Card
                              key={meal.id}
                              className={`cursor-pointer transition-all hover:bg-neutral-50 ${
                                localSelectedMeals[selectedDate.getDay()] ===
                                meal.id
                                  ? "border-primary shadow-sm bg-primary/5"
                                  : "border-gray-200"
                              }`}
                              onClick={() =>
                                localUpdateMealSelection(
                                  selectedDate.getDay(),
                                  meal.id,
                                )
                              }
                            >
                              <div className="flex items-center p-3">
                                <div className="w-16 h-16 rounded-md overflow-hidden mr-3 flex-shrink-0 bg-neutral-100">
                                  <img
                                    src={
                                      meal.image ||
                                      "https://placehold.co/400x400/e2e8f0/64748b?text=Millet+Meal"
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
                                  <div className="flex flex-wrap gap-1 mt-1">
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
                                {localSelectedMeals[selectedDate.getDay()] ===
                                  meal.id && (
                                  <div className="ml-2 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-primary" />
                                  </div>
                                )}
                              </div>
                            </Card>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-neutral-50 p-4 rounded-lg border">
                  <h4 className="font-medium text-sm mb-3 flex items-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mr-2">
                      3
                    </span>
                    Your Selected Meals
                  </h4>

                  {Object.keys(localSelectedMeals).length > 0 ? (
                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
                      {Object.entries(localSelectedMeals).map(
                        ([day, mealId]) => {
                          const dayNumber = parseInt(day);
                          const selectedMeal = meals?.find(
                            (m: any) => m.id === mealId,
                          );

                          // Get date for this day
                          const startDate = new Date(form.watch("startDate"));
                          const dayIndex = Array.from({ length: 7 }).findIndex(
                            (_, i) =>
                              (startDate.getDay() + i) % 7 === dayNumber,
                          );
                          const mealDate = addDays(startDate, dayIndex);
                          const formattedDate = format(mealDate, "MMM d");

                          return (
                            <Card key={day} className="border border-gray-200">
                              <div className="p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center">
                                    <span className="font-medium capitalize">
                                      {getDayName(dayNumber)}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      {formattedDate}
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => {
                                      setLocalSelectedMeals((prev: any) => {
                                        const newState = { ...prev };
                                        delete newState[dayNumber];
                                        return newState;
                                      });
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded overflow-hidden mr-2 bg-neutral-100">
                                    <img
                                      src={
                                        selectedMeal?.image ||
                                        "https://placehold.co/400x400/e2e8f0/64748b?text=Meal"
                                      }
                                      alt={selectedMeal?.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {selectedMeal?.name}
                                    </p>
                                    <div className="flex gap-1 mt-0.5">
                                      {selectedMeal?.dietaryPreferences
                                        ?.slice(0, 2)
                                        .map((pref: string) => (
                                          <Badge
                                            key={pref}
                                            variant="outline"
                                            className="text-xs px-1 py-0"
                                          >
                                            {pref}
                                          </Badge>
                                        ))}
                                      {selectedMeal?.dietaryPreferences
                                        ?.length > 2 && (
                                        <span className="text-xs text-gray-500">
                                          +
                                          {selectedMeal.dietaryPreferences
                                            .length - 2}{" "}
                                          more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        },
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <Calendar className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">
                        No meals selected yet. Select days and choose your
                        meals.
                      </p>
                    </div>
                  )}

                  {Object.keys(localSelectedMeals).length > 0 && (
                    <div className="mt-4 pt-3 border-t text-center">
                      <p className="text-xs text-gray-500 mb-2">
                        {Object.keys(localSelectedMeals).length} meal
                        {Object.keys(localSelectedMeals).length !== 1
                          ? "s"
                          : ""}{" "}
                        selected
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomMealModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveSelections}
              disabled={Object.keys(localSelectedMeals).length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              Save Selections
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
