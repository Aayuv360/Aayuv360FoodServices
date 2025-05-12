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
              <DialogTitle className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackClick}
                  className="mr-2 -ml-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <span>{selectedCurryOption ? "Edit Curry Option" : "Add New Curry Option"}</span>
              </DialogTitle>
              <DialogDescription>
                {selectedCurryOption
                  ? "Update curry option information"
                  : "Fill in the information for the new curry option"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCurryFormSubmit} className="mt-4">
              <div className="space-y-5">
                {/* Hidden ID field with auto-generated value for both new and existing curry options */}
                <input 
                  type="hidden" 
                  name="id" 
                  value={selectedCurryOption ? selectedCurryOption.id : `curry_${Date.now()}`} 
                />
                
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium block">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedCurryOption?.name}
                    placeholder="e.g., Regular Curry, Spicy Curry"
                    required
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="priceAdjustment" className="text-sm font-medium block">
                    Price Adjustment (₹) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="priceAdjustment"
                    name="priceAdjustment"
                    type="number"
                    step="0.01"
                    defaultValue={selectedCurryOption?.priceAdjustment || 0}
                    required
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Amount to add to base meal price (can be negative for discounts)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium block">
                    Description
                  </label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={selectedCurryOption?.description}
                    placeholder="Description of the curry option"
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6 border-t pt-4">
                <Button type="button" variant="outline" onClick={handleBackClick}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary">
                  {selectedCurryOption ? "Update Option" : "Create Option"}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                Manage Curry Options for {meal.name}
              </DialogTitle>
              <DialogDescription>
                Create, edit, or delete curry options for this meal.
              </DialogDescription>
              <Button 
                onClick={handleAddCurryOption}
                className="w-full mt-4 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Curry Option
              </Button>
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              {curryOptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No curry options available. Click "Add Curry Option" to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {curryOptions.map((curry) => (
                    <div 
                      key={curry.id} 
                      className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">{curry.name}</h3>
                          <div className="mt-1">
                            <span className={`text-sm font-medium ${curry.priceAdjustment > 0 ? 'text-green-600' : curry.priceAdjustment < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                              {curry.priceAdjustment > 0 ? "+" : ""}{formatPrice(curry.priceAdjustment)}
                            </span>
                          </div>
                          {curry.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{curry.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCurryOption(curry)}
                            className="h-8 rounded-full hover:bg-gray-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600"
                              >
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
                    </div>
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