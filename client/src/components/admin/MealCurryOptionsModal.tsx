import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MealCurryOptionsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMeal: any;
  curryOptions: any[];
  onEditCurryOption: (curry: any) => void;
  onDeleteCurryOption: (curryId: string) => void;
  onAddCurryOption: (mealId: number | undefined) => void;
}

export default function MealCurryOptionsModal({
  isOpen,
  onOpenChange,
  selectedMeal,
  curryOptions,
  onEditCurryOption,
  onDeleteCurryOption,
  onAddCurryOption,
}: MealCurryOptionsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Curry Options for {selectedMeal?.name}</DialogTitle>
          <DialogDescription>
            Manage the curry options available for this meal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4 max-h-[400px] overflow-y-auto pr-2">
          {curryOptions
            ?.filter(
              (curry: any) =>
                curry.mealId === selectedMeal?.id || curry.mealId === null
            )
            .map((curry: any) => (
              <Card key={curry.id} className="shadow-sm border">
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{curry.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditCurryOption(curry)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteCurryOption(curry.id)}
                        className="h-8 w-8 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="text-sm text-muted-foreground">
                    {curry.description}
                  </p>
                  <div className="mt-2 flex justify-between">
                    <span className="text-sm font-medium">
                      Price Adjustment: ₹{curry.priceAdjustment}
                    </span>
                    <Badge
                      variant="outline"
                      className={curry.mealId === null ? "bg-blue-50" : ""}
                    >
                      {curry.mealId === null
                        ? "Available for all meals"
                        : "Meal specific"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

          {curryOptions?.filter(
            (curry: any) =>
              curry.mealId === selectedMeal?.id || curry.mealId === null
          ).length === 0 && (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                No curry options available for this meal.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            onClick={() => {
              onOpenChange(false);
            }}
            variant="outline"
          >
            Close
          </Button>
          <Button
            onClick={() => onAddCurryOption(selectedMeal?.id)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Curry Option
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}