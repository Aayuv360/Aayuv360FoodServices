import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Location {
  id: number;
  area: string;
  pincode: string;
  deliveryFee: number;
  lng: number;
  lnt: number;
  serviceRadius: number;
}

const LocationManagement = () => {
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isDeleteLocationDialogOpen, setIsDeleteLocationDialogOpen] =
    useState(false);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/locations");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch locations");
      }
      return await res.json();
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: async (locationData: Omit<Location, "id">) => {
      const res = await apiRequest("POST", "/api/locations", locationData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create location");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setIsLocationDialogOpen(false);
      toast({
        title: "Success",
        description: "Location added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add location",
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({
      id,
      locationData,
    }: {
      id: number;
      locationData: Partial<Location>;
    }) => {
      const res = await apiRequest("PUT", `/api/locations/${id}`, locationData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update location");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setIsLocationDialogOpen(false);
      toast({
        title: "Success",
        description: "Location updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update location",
        variant: "destructive",
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/locations/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete location");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setIsDeleteLocationDialogOpen(false);
      toast({
        title: "Success",
        description: "Location deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete location",
        variant: "destructive",
      });
    },
  });

  const handleLocationFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const locationData = {
      area: formData.get("area") as string,
      pincode: formData.get("pincode") as string,
      deliveryFee: Number(formData.get("deliveryFee")),
      lng: Number(formData.get("lng")),
      lnt: Number(formData.get("lnt")),
      serviceRadius: Number(formData.get("serviceRadius")),
    };

    if (selectedLocation) {
      updateLocationMutation.mutate({
        id: selectedLocation.id,
        locationData,
      });
    } else {
      createLocationMutation.mutate(locationData);
    }
  };

  const handleAddLocation = () => {
    setSelectedLocation(null);
    setIsLocationDialogOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setIsLocationDialogOpen(true);
  };

  const handleDeleteLocationClick = (location: Location) => {
    setSelectedLocation(location);
    setIsDeleteLocationDialogOpen(true);
  };

  const handleDeleteLocationConfirm = () => {
    if (selectedLocation) {
      deleteLocationMutation.mutate(selectedLocation.id);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Delivery Locations</CardTitle>
            <CardDescription>
              Manage the areas where your millet meals can be delivered
            </CardDescription>
          </div>
          <Button onClick={handleAddLocation}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : locations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Pincode</TableHead>
                  <TableHead>Longitude</TableHead>
                  <TableHead>Latitude</TableHead>
                  <TableHead>Service Radius</TableHead>
                  <TableHead>Delivery Fee (₹)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location: Location) => (
                  <TableRow key={location.id}>
                    <TableCell>{location.id}</TableCell>
                    <TableCell>{location.area}</TableCell>
                    <TableCell>{location.pincode}</TableCell>
                    <TableCell>{location.lng}</TableCell>
                    <TableCell>{location.lnt}</TableCell>
                    <TableCell>{location.serviceRadius}</TableCell>
                    <TableCell>₹{location.deliveryFee}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditLocation(location)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLocationClick(location)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex justify-center py-8 text-muted-foreground">
              No locations found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Add/Edit Dialog */}
      <Dialog
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedLocation ? "Edit Location" : "Add Location"}
            </DialogTitle>
            <DialogDescription>
              {selectedLocation
                ? "Update delivery location details."
                : "Add a new delivery location."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLocationFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="area"
                  className="text-right text-sm font-medium"
                >
                  Area
                </label>
                <Input
                  id="area"
                  name="area"
                  defaultValue={selectedLocation?.area}
                  placeholder="e.g., Hitech City"
                  required
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="pincode"
                  className="text-right text-sm font-medium"
                >
                  Pincode
                </label>
                <Input
                  id="pincode"
                  name="pincode"
                  defaultValue={selectedLocation?.pincode}
                  placeholder="e.g., 500081"
                  required
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="lng" className="text-right text-sm font-medium">
                  Longitude
                </label>
                <Input
                  id="lng"
                  name="lng"
                  type="number"
                  min="0"
                  step="any"
                  defaultValue={selectedLocation?.lng}
                  required
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="lnt" className="text-right text-sm font-medium">
                  Latitude
                </label>
                <Input
                  id="lnt"
                  name="lnt"
                  type="number"
                  min="0"
                  step="any"
                  defaultValue={selectedLocation?.lnt}
                  required
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="serviceRadius"
                  className="text-right text-sm font-medium"
                >
                  Service Radius
                </label>
                <Input
                  id="serviceRadius"
                  name="serviceRadius"
                  type="number"
                  min="0"
                  step="any"
                  defaultValue={selectedLocation?.serviceRadius}
                  required
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="deliveryFee"
                  className="text-right text-sm font-medium"
                >
                  Delivery Fee (₹)
                </label>
                <Input
                  id="deliveryFee"
                  name="deliveryFee"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={
                    selectedLocation ? selectedLocation.deliveryFee : 30
                  }
                  required
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {selectedLocation ? "Update Location" : "Add Location"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Location Dialog */}
      <AlertDialog
        open={isDeleteLocationDialogOpen}
        onOpenChange={setIsDeleteLocationDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the delivery location from your
              system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLocationConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LocationManagement;
