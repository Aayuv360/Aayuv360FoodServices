import React, { useState, useEffect } from "react";
import { MapPin, ChevronDown, Plus, Navigation, Search } from "lucide-react";
import { useLocationManager } from "@/hooks/use-location-manager";
import { NewAddressModal } from "@/components/Modals/NewAddressModal";
import { Input } from "@/components/ui/input";
import { useLoadScript } from "@react-google-maps/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Static libraries array to prevent reloading
const GOOGLE_MAPS_LIBRARIES: "places"[] = ["places"];

const LocationSelector = () => {
  const [isNewAddressModalOpen, setIsNewAddressModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const { toast } = useToast();
  
  const { user } = useAuth();
  const { 
    selectedAddress, 
    savedAddresses, 
    selectAddress,
    getCurrentLocation,
    isLoading,
    refreshSavedAddresses
  } = useLocationManager();
  const {
    data: apiAddresses = [],
    isLoading: addressesLoading,
    refetch: refetchAddresses,
  } = useQuery({
    queryKey: ["/api/addresses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest("GET", "/api/addresses");
      if (!res.ok) {
        if (res.status === 401) return []; // User not authenticated
        throw new Error("Failed to fetch addresses");
      }
      return await res.json();
    },
    enabled: !!user, // Only run query when user is logged in
  });

  // Google Maps script
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAnwH0jPc54BR-sdRBybXkwIo5QjjGceSI",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

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

  // Google Places search
  const fetchSuggestions = async (input: string) => {
    if (!window.google || !input.trim()) {
      setSuggestions([]);
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: "in" },
        types: ["address"],
      },
      (predictions, status) => {
        if (status === "OK" && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      }
    );
  };

  // Debounced search for Google Places
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput && isLoaded) {
        fetchSuggestions(searchInput);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput, isLoaded]);

  const handlePlaceSelect = (suggestion: google.maps.places.AutocompletePrediction) => {
    const service = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );

    service.getDetails({ placeId: suggestion.place_id }, (place, status) => {
      if (status === "OK" && place?.geometry?.location) {
        const coords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        // Create a temporary address object
        const tempAddress = {
          id: Date.now(), // Temporary ID
          label: "Search Result",
          address: suggestion.description,
          coords,
          pincode: "",
          isDefault: false,
        };

        selectAddress(tempAddress);
        setSearchInput("");
        setSuggestions([]);
        
        toast({
          title: "Location Selected",
          description: "Location updated from search",
        });
      }
    });
  };

  const handleNewAddressAdded = (addressData: any) => {
    setIsNewAddressModalOpen(false);
    // Refresh both local state and API addresses
    refreshSavedAddresses();
    refetchAddresses();
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
        
        <DropdownMenuContent align="start" className="w-80">
          <div className="px-2 py-1.5 text-sm font-medium text-gray-700">
            Select Delivery Location
          </div>
          <DropdownMenuSeparator />
          
          {/* Google Places Search */}
          <div className="px-2 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for area, landmark..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.place_id}
                    onClick={() => handlePlaceSelect(suggestion)}
                    className="px-2 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{suggestion.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Current Location Option */}
          <DropdownMenuItem onClick={handleCurrentLocation} disabled={isLoading}>
            <Navigation className="h-4 w-4 mr-2" />
            <span>Use Current Location</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Saved Addresses from API */}
          {apiAddresses.length > 0 ? (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Saved Addresses
              </div>
              {apiAddresses.map((address: any) => (
                <DropdownMenuItem 
                  key={address.id}
                  onClick={() => handleAddressSelect({
                    id: address.id,
                    label: address.label || "Address",
                    address: `${address.addressLine1}, ${address.addressLine2 || ""}, ${address.city || ""}`,
                    coords: {
                      lat: address.latitude || 0,
                      lng: address.longitude || 0,
                    },
                    pincode: address.pincode,
                    isDefault: address.isDefault,
                  })}
                  className="flex-col items-start py-2"
                >
                  <div className="flex items-center w-full">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{address.label || "Address"}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {address.addressLine1}, {address.addressLine2 || ""}, {address.city || ""}
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
              {!user ? (
                <div className="px-2 py-4 text-center text-sm text-gray-500">
                  Please login to see saved addresses
                </div>
              ) : addressesLoading ? (
                <div className="px-2 py-4 text-center text-sm text-gray-500">
                  Loading addresses...
                </div>
              ) : (
                <div className="px-2 py-4 text-center text-sm text-gray-500">
                  No saved addresses yet
                </div>
              )}
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Add New Address - Only show when user is logged in */}
          {user && (
            <DropdownMenuItem onClick={() => setIsNewAddressModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              <span>Add New Address</span>
            </DropdownMenuItem>
          )}
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