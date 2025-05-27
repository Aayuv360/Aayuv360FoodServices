import React, { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Home, Briefcase, Hotel, MoreHorizontal } from "lucide-react";
import { Label } from "@/components/ui/label";
interface Location {
  id: number;
  name: string;
  pincode: string;
  lat: number;
  lng: number;
  available: boolean;
}

export const NewAddressModal = ({
  addressModalOpen,
  setAddressModalOpen,
  locationSearch,
  filteredLocations,
  handleAddressFormSubmit,
  setLocationSearch,
  selectLocation,
  editingAddress,
}: any) => {
  const [addressType, setAddressType] = useState(editingAddress?.name || "Home");

  return (
    <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>{editingAddress ? "Edit Delivery Address" : "Add New Delivery Address"}</DialogTitle>
          <DialogDescription>
            Search for your location on the map or enter address details
            manually.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Left side - Map and Location Search */}
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search for location in Hyderabad"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="pr-10"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            {locationSearch && filteredLocations.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredLocations.map((location: Location) => (
                    <div
                      key={location.id}
                      className={`p-2 cursor-pointer hover:bg-gray-100 ${
                        !location.available ? "opacity-50" : ""
                      }`}
                      onClick={() =>
                        location.available && selectLocation(location)
                      }
                    >
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-primary mt-0.5 mr-2 shrink-0" />
                        <div>
                          <p className="font-medium">{location.name}</p>
                          <p className="text-sm text-gray-600">
                            Pincode: {location.pincode}
                          </p>
                          {!location.available && (
                            <p className="text-xs text-red-600 mt-1">
                              Currently not serviceable
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-[300px] bg-gray-100 rounded-md border flex items-center justify-center">
              <div className="text-center p-4">
                <MapPin className="h-10 w-10 text-primary/50 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Map view would appear here
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  We deliver in select areas of Hyderabad
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <form
              id="address-form"
              onSubmit={(e) => {
                e.preventDefault(); // Prevent form submission
                handleAddressFormSubmit(e); // Handle address form submission
              }}
              className="space-y-4"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <div className="flex gap-2">
                      {[
                        { label: "Home", icon: Home },
                        { label: "Office", icon: Briefcase },
                        { label: "Hotel", icon: Hotel },
                        { label: "Others", icon: MoreHorizontal },
                      ].map(({ label, icon: Icon }) => (
                        <Button
                          key={label}
                          type="button"
                          variant={
                            addressType === label ? "default" : "outline"
                          }
                          onClick={() => setAddressType(label)}
                          className="flex items-center gap-1 px-3 py-2"
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </Button>
                      ))}
                    </div>
                    <input
                      type="hidden"
                      name="addressName"
                      value={addressType}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address-phone">Phone Number</Label>
                    <Input
                      id="address-phone"
                      name="phone"
                      placeholder="10-digit mobile number"
                      defaultValue={editingAddress?.phone || ""}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address-line1">Address Line 1</Label>
                  <Input
                    id="address-line1"
                    name="addressLine1"
                    placeholder="House/Flat No., Street, Locality"
                    defaultValue={editingAddress?.addressLine1 || ""}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address-line2">
                    Address Line 2 (Optional)
                  </Label>
                  <Input
                    id="address-line2"
                    name="addressLine2"
                    placeholder="Landmark, Area, etc."
                    defaultValue={editingAddress?.addressLine2 || ""}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="address-city">City</Label>
                    <Input
                      id="address-city"
                      name="city"
                      placeholder="City"
                      defaultValue={editingAddress?.city || "Hyderabad"}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="address-state">State</Label>
                    <Input
                      id="address-state"
                      name="state"
                      placeholder="State"
                      defaultValue={editingAddress?.state || "Telangana"}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="address-pincode">Pincode</Label>
                    <Input
                      id="address-pincode"
                      name="pincode"
                      placeholder="6-digit pincode"
                      defaultValue={editingAddress?.pincode || ""}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="address-default" 
                    name="isDefault" 
                    defaultChecked={editingAddress?.isDefault || false}
                  />
                  <Label htmlFor="address-default" className="font-normal">
                    Set as default address
                  </Label>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddressModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Address</Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
