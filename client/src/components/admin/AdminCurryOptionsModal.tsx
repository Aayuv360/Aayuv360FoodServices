import React, { useState } from "react";
import { Meal } from "@shared/schema";
import { X, Edit, Trash2, PlusCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

// This represents a single curry option for a meal
interface CurryOption {
  id: string;
  name: string;
  priceAdjustment: number;
  description?: string;
}

interface AdminCurryOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: Meal;
}

export function AdminCurryOptionsModal({
  open,
  onOpenChange,
  meal,
}: AdminCurryOptionsModalProps) {
  const { toast } = useToast();
  const [isAddEditFormVisible, setIsAddEditFormVisible] = useState(false);
  const [selectedCurryOption, setSelectedCurryOption] = useState<CurryOption | null>(null);
  
  // Convert meal curry options from array format to object format
  const curryOptions: CurryOption[] = meal.curryOptions ? 
    meal.curryOptions.map((option: any) => ({
      id: option[0],
      name: option[1],
      priceAdjustment: option[2],
      description: option[3] || ""
    })) : [];
  
  // Create curry option mutation
  const createCurryOptionMutation = useMutation({
    mutationFn: async (curryData: any) => {
      const res = await apiRequest("POST", "/api/admin/curry-options", curryData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create curry option");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/curry-options"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meals"] });
      toast({
        title: "Success",
        description: "Curry option created successfully",
      });
      setIsAddEditFormVisible(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create curry option",
        variant: "destructive",
      });
    },
  });

  // Update curry option mutation
  const updateCurryOptionMutation = useMutation({
    mutationFn: async ({ id, curryData }: { id: string; curryData: any }) => {
      const res = await apiRequest("PUT", `/api/admin/curry-options/${id}`, curryData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update curry option");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/curry-options"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meals"] });
      toast({
        title: "Success",
        description: "Curry option updated successfully",
      });
      setIsAddEditFormVisible(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update curry option",
        variant: "destructive",
      });
    },
  });

  // Delete curry option mutation
  const deleteCurryOptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/curry-options/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete curry option");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/curry-options"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/meals"] });
      toast({
        title: "Success",
        description: "Curry option deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete curry option",
        variant: "destructive",
      });
    },
  });

  const handleAddCurryOption = () => {
    setSelectedCurryOption(null);
    setIsAddEditFormVisible(true);
  };

  const handleEditCurryOption = (curryOption: CurryOption) => {
    setSelectedCurryOption(curryOption);
    setIsAddEditFormVisible(true);
  };

  const handleDeleteCurryOption = (curryId: string) => {
    deleteCurryOptionMutation.mutate(curryId);
  };

  const handleCurryFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const curryData = {
      id: formData.get('id') as string,
      name: formData.get('name') as string,
      priceAdjustment: parseFloat(formData.get('priceAdjustment') as string),
      description: formData.get('description') as string,
      mealId: meal.id,
    };
    
    if (selectedCurryOption) {
      updateCurryOptionMutation.mutate({ id: selectedCurryOption.id, curryData });
    } else {
      createCurryOptionMutation.mutate(curryData);
    }
  };

  const handleBackClick = () => {
    setIsAddEditFormVisible(false);
    setSelectedCurryOption(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {isAddEditFormVisible ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackClick}
                  className="mr-2 -ml-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <span>{selectedCurryOption ? "Edit Curry Option" : "Add Curry Option"}</span>
              </DialogTitle>
              <DialogDescription>
                {selectedCurryOption
                  ? "Update curry option information"
                  : "Fill in the information for the new curry option"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCurryFormSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="id" className="text-right text-sm font-medium">
                    ID
                  </label>
                  <Input
                    id="id"
                    name="id"
                    defaultValue={selectedCurryOption?.id || `curry_${Date.now()}`}
                    placeholder="e.g., regular, spicy, mild"
                    required
                    disabled={!!selectedCurryOption}
                    className="col-span-3"
                  />
                  {!selectedCurryOption && (
                    <p className="text-xs text-gray-500 mt-1 col-span-4 text-right">
                      Must be unique and URL-friendly (lowercase, no spaces)
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="name" className="text-right text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedCurryOption?.name}
                    placeholder="e.g., Regular Curry, Spicy Curry"
                    required
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="priceAdjustment" className="text-right text-sm font-medium">
                    Price Adjustment (₹)
                  </label>
                  <Input
                    id="priceAdjustment"
                    name="priceAdjustment"
                    type="number"
                    step="0.01"
                    defaultValue={selectedCurryOption?.priceAdjustment || 0}
                    required
                    className="col-span-3"
                  />
                  <p className="text-xs text-gray-500 mt-1 col-span-4 text-right">
                    Amount to add to base meal price
                  </p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="description" className="text-right text-sm font-medium">
                    Description
                  </label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={selectedCurryOption?.description}
                    placeholder="Description of the curry option"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleBackClick} className="mr-2">
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedCurryOption ? "Update Curry Option" : "Create Curry Option"}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>Manage Curry Options for {meal.name}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddCurryOption}
                  className="ml-auto"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Curry Option
                </Button>
              </DialogTitle>
              <DialogDescription>
                Create, edit, or delete curry options for this meal.
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              {curryOptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No curry options available. Click "Add Curry Option" to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {curryOptions.map((curry) => (
                    <Card key={curry.id} className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{curry.name}</h3>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCurryOption(curry)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Curry Option
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this curry option? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCurryOption(curry.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-primary">
                            {curry.priceAdjustment > 0 ? "+" : ""}{formatPrice(curry.priceAdjustment)}
                          </p>
                          {curry.description && (
                            <p className="text-gray-600">{curry.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}