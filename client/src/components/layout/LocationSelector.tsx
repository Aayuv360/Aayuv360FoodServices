import React, { useState } from "react";
import { MapPin, ChevronDown, Plus, Navigation } from "lucide-react";
import { useLocationManager } from "@/hooks/use-location-manager";
import { NewAddressModal } from "@/components/Modals/NewAddressModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const LocationSelector = () => {
  const [isNewAddressModalOpen, setIsNewAddressModalOpen] = useState(false);
  const { toast } = useToast();
  const { 
    selectedAddress, 
    savedAddresses, 
    selectAddress,
    getCurrentLocation,
    isLoading,
    refreshSavedAddresses
  } = useLocationManager();

  const displayText = selectedAddress?.label || selectedAddress?.address || "Select Location";

  const handleAddressSelect = (address: any) => {
    selectAddress(address);
    toast({
      title: "Location Updated",
      description: `Delivery location set to ${address.label}`,
    });
  };

  const handleCurrentLocation = async () => {
    try {
      await getCurrentLocation();
      toast({
        title: "Location Updated",
        description: "Using your current location",
      });
    } catch (error) {
      toast({
        title: "Location Error",
        description: "Could not get your current location",
        variant: "destructive",
      });
    }
  };

  const handleNewAddressAdded = (addressData: any) => {
    setIsNewAddressModalOpen(false);
    // The address is automatically saved through the modal's internal logic
    refreshSavedAddresses();
    toast({
      title: "Address Added",
      description: "New address has been saved successfully",
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="cursor-pointer gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition flex items-center py-2 px-2 sm:px-4 max-w-[200px] sm:max-w-[300px] rounded-md hover:bg-gray-50">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 hover:text-primary flex-shrink-0" />
            <div className="whitespace-nowrap overflow-hidden text-ellipsis">
              {displayText}
            </div>
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-72">
          <div className="px-2 py-1.5 text-sm font-medium text-gray-700">
            Select Delivery Location
          </div>
          <DropdownMenuSeparator />
          
          {/* Current Location Option */}
          <DropdownMenuItem onClick={handleCurrentLocation} disabled={isLoading}>
            <Navigation className="h-4 w-4 mr-2" />
            <span>Use Current Location</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Saved Addresses */}
          {savedAddresses.length > 0 ? (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Saved Addresses
              </div>
              {savedAddresses.map((address) => (
                <DropdownMenuItem 
                  key={address.id}
                  onClick={() => handleAddressSelect(address)}
                  className="flex-col items-start py-2"
                >
                  <div className="flex items-center w-full">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{address.label}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {address.address}
                      </div>
                      {address.isDefault && (
                        <div className="text-xs text-blue-600 font-medium">Default</div>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <>
              <div className="px-2 py-4 text-center text-sm text-gray-500">
                No saved addresses yet
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Add New Address */}
          <DropdownMenuItem onClick={() => setIsNewAddressModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            <span>Add New Address</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NewAddressModal
        addressModalOpen={isNewAddressModalOpen}
        setAddressModalOpen={setIsNewAddressModalOpen}
        handleAddressFormSubmit={handleNewAddressAdded}
        addressModalAction="add"
      />
    </>
  );
};

export default LocationSelector;