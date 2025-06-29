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
import { useAuth } from "@/hooks/use-auth";
import { useServiceArea } from "@/hooks/use-service-area";

const GOOGLE_MAPS_LIBRARIES: "places"[] = ["places"];

const LocationSelector = () => {
  const [isNewAddressModalOpen, setIsNewAddressModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { user } = useAuth();
  const {
    selectedAddress,
    savedAddresses,
    selectAddress,
    isLoading: locationLoading,
    refreshSavedAddresses,
  } = useLocationManager();
  const {
    isWithinServiceArea,
    checkServiceAvailability,
    getServiceMessage,
    isLoading: serviceLoading,
  } = useServiceArea();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAnwH0jPc54BR-sdRBybXkwIo5QjjGceSI",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const getDisplayText = () => {
    if (selectedAddress?.address) {
      const addr = selectedAddress.address;
      return addr.length > 30 ? addr.substring(0, 30) + "..." : addr;
    }
    return "Select Location";
  };

  const displayText = getDisplayText();

  const handleAddressSelect = (address: any) => {
    selectAddress(address);
    // toast({
    //   title: "Location Updated",
    //   description: `Delivery location set to ${address.label || address.address}`,
    // });
  };

  const handleCurrentLocation = async () => {
    try {
      setIsLoading(true);

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported"));
            return;
          }

          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        },
      );

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        const result = await new Promise<google.maps.GeocoderResult[]>(
          (resolve, reject) => {
            geocoder.geocode({ location: coords }, (results, status) => {
              if (status === "OK" && results) {
                resolve(results);
              } else {
                reject(new Error("Geocoding failed"));
              }
            });
          },
        );

        if (result.length > 0) {
          const address = result[0].formatted_address;
          const currentLocationAddress = {
            id: Date.now(),
            label: "Current Location",
            address: address,
            coords,
            pincode: "",
            isDefault: false,
          };

          selectAddress(currentLocationAddress);
          // toast({
          //   title: "Location Updated",
          //   description: "Using your current location",
          // });
        }
      } else {
        const currentLocationAddress = {
          id: Date.now(),
          label: "Current Location",
          address: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
          coords,
          pincode: "",
          isDefault: false,
        };

        selectAddress(currentLocationAddress);
        // toast({
        //   title: "Location Updated",
        //   description: "Using your current location",
        // });
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      // toast({
      //   title: "Location Error",
      //   description:
      //     "Could not get your current location. Please check permissions.",
      //   variant: "destructive",
      // });
    } finally {
      setIsLoading(false);
    }
  };

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
      },
    );
  };

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

  const handlePlaceSelect = (
    suggestion: google.maps.places.AutocompletePrediction,
  ) => {
    const service = new window.google.maps.places.PlacesService(
      document.createElement("div"),
    );

    service.getDetails({ placeId: suggestion.place_id }, (place, status) => {
      if (status === "OK" && place?.geometry?.location) {
        const coords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        const tempAddress = {
          id: Date.now(),
          label: "Search Result",
          address: suggestion.description,
          coords,
          pincode: "",
          isDefault: false,
        };

        // selectAddress(tempAddress);
        console.log("tete", tempAddress);
        setSearchInput("");
        setSuggestions([]);

        // toast({
        //   title: "Location Selected",
        //   description: "Location updated from search",
        // });
      }
    });
  };

  useEffect(() => {
    if (!user && !selectedAddress && isLoaded) {
      const timer = setTimeout(() => {
        if (!selectedAddress) {
          handleCurrentLocation();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, selectedAddress, isLoaded]);

  const handleNewAddressAdded = (addressData: any) => {
    setIsNewAddressModalOpen(false);
    refreshSavedAddresses();
    // toast({
    //   title: "Address Added",
    //   description: "New address has been saved successfully",
    // });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="cursor-pointer gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition flex items-center py-2 px-2 sm:px-4 max-w-[200px] sm:max-w-[300px] rounded-md hover:bg-gray-50">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 hover:text-primary flex-shrink-0" />
            <div className="whitespace-nowrap overflow-hidden text-ellipsis font-medium">
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

          <DropdownMenuItem
            onClick={handleCurrentLocation}
            disabled={isLoading || locationLoading}
          >
            <Navigation className="h-4 w-4 mr-2" />
            <span>
              {isLoading || locationLoading
                ? "Getting location..."
                : "Use Current Location"}
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {savedAddresses.length > 0 ? (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Saved Addresses
              </div>
              {savedAddresses.map((address: any) => (
                <DropdownMenuItem
                  key={address.id}
                  onClick={() =>
                    handleAddressSelect({
                      id: address.id,
                      label: address.label || "Address",
                      address: `${address.addressLine1}, ${address.addressLine2 || ""}, ${address.city || ""}`,
                      coords: {
                        lat: address.latitude || 0,
                        lng: address.longitude || 0,
                      },
                      pincode: address.pincode,
                      isDefault: address.isDefault,
                    })
                  }
                  className="flex-col items-start py-2"
                >
                  <div className="flex items-center w-full">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {address.label || "Address"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {address.addressLine1}, {address.addressLine2 || ""},{" "}
                        {address.city || ""}
                      </div>
                      {address.isDefault && (
                        <div className="text-xs text-blue-600 font-medium">
                          Default
                        </div>
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
