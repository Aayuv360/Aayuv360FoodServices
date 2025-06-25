import React, { useState, useEffect, useCallback } from "react";
import { useLoadScript } from "@react-google-maps/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Search, 
  Plus, 
  Home, 
  Building, 
  Navigation,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2
} from "lucide-react";
import { useLocationManager } from "@/hooks/use-location-manager";
import { useServiceArea } from "@/hooks/use-service-area";
import { LocationCoords, SavedAddress } from "@/Recoil/recoil";
import { useToast } from "@/hooks/use-toast";

// Static libraries array to prevent reloading
const GOOGLE_MAPS_LIBRARIES: "places"[] = ["places"];

interface LocationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationConfirmed?: (address: SavedAddress | LocationCoords) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onOpenChange,
  onLocationConfirmed,
}) => {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    label: "",
    address: "",
    coords: null as LocationCoords | null,
    pincode: "",
    isDefault: false,
  });
  const [tempLocation, setTempLocation] = useState<LocationCoords | null>(null);
  const [tempLocationAddress, setTempLocationAddress] = useState("");

  const {
    currentLocation,
    selectedAddress,
    savedAddresses,
    activeLocation,
    isLoading,
    error,
    serviceArea,
    getCurrentLocationAsync,
    selectAddress,
    selectCurrentLocation,
    addNewAddress,
    deleteAddress,
    clearError,
    checkLocationServiceArea,
  } = useLocationManager();

  const { 
    isWithinServiceArea, 
    checkServiceAvailability, 
    getServiceMessage, 
    distance 
  } = useServiceArea();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAnwH0jPc54BR-sdRBybXkwIo5QjjGceSI",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

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

  const fetchSuggestions = (input: string) => {
    if (!window.google || !input) return;

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

  const handleSelectSuggestion = (placeId: string) => {
    if (!window.google || !placeId) return;

    const service = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );

    service.getDetails(
      {
        placeId,
        fields: ["geometry", "formatted_address", "address_components"],
      },
      (place, status) => {
        if (status === "OK" && place && place.geometry?.location) {
          const location = place.geometry.location;
          const coords: LocationCoords = {
            lat: location.lat(),
            lng: location.lng(),
          };

          const address = place.formatted_address || "Unknown address";
          
          // Extract pincode from address components
          let pincode = "";
          if (place.address_components) {
            const pincodeComponent = place.address_components.find(
              component => component.types.includes("postal_code")
            );
            pincode = pincodeComponent?.long_name || "";
          }

          setTempLocation(coords);
          setTempLocationAddress(address);
          setNewAddressForm(prev => ({
            ...prev,
            address,
            coords,
            pincode,
          }));
          
          // Check service availability
          checkServiceAvailability(coords);
          
          setSuggestions([]);
          setSearchInput("");
        }
      }
    );
  };

  const handleUseCurrentLocation = async () => {
    try {
      const coords = await getCurrentLocationAsync();
      setTempLocation(coords);
      
      // Reverse geocode to get address
      if (window.google && coords) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { location: coords },
          (results, status) => {
            if (status === "OK" && results?.[0]) {
              const address = results[0].formatted_address;
              setTempLocationAddress(address);
              setNewAddressForm(prev => ({
                ...prev,
                address,
                coords,
              }));
            }
          }
        );
      }
      
      checkServiceAvailability(coords);
    } catch (error) {
      toast({
        title: "Location Error",
        description: error instanceof Error ? error.message : "Failed to get current location",
        variant: "destructive",
      });
    }
  };

  const handleConfirmLocation = () => {
    if (tempLocation && isWithinServiceArea) {
      if (onLocationConfirmed) {
        onLocationConfirmed(tempLocation);
      }
      onOpenChange(false);
      setTempLocation(null);
      setTempLocationAddress("");
    }
  };

  const handleSelectSavedAddress = (address: SavedAddress) => {
    selectAddress(address);
    checkServiceAvailability(address.coords);
    if (onLocationConfirmed) {
      onLocationConfirmed(address);
    }
    onOpenChange(false);
  };

  const handleAddNewAddress = async () => {
    if (!newAddressForm.address || !newAddressForm.coords) {
      toast({
        title: "Invalid Address",
        description: "Please select a valid address first",
        variant: "destructive",
      });
      return;
    }

    try {
      const savedAddress = await addNewAddress({
        label: newAddressForm.label || "New Address",
        address: newAddressForm.address,
        coords: newAddressForm.coords,
        pincode: newAddressForm.pincode,
        isDefault: newAddressForm.isDefault,
      });

      toast({
        title: "Address Saved",
        description: "Your new address has been saved successfully",
      });

      if (onLocationConfirmed) {
        onLocationConfirmed(savedAddress);
      }
      
      setShowAddAddressForm(false);
      setNewAddressForm({
        label: "",
        address: "",
        coords: null,
        pincode: "",
        isDefault: false,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      await deleteAddress(addressId);
      toast({
        title: "Address Deleted",
        description: "Address has been removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  const getDistanceMessage = () => {
    if (tempLocation && currentLocation) {
      const distance = Math.sqrt(
        Math.pow(tempLocation.lat - currentLocation.lat, 2) + 
        Math.pow(tempLocation.lng - currentLocation.lng, 2)
      ) * 111; // Rough conversion to km
      
      if (distance > 1) {
        return `You are ${distance.toFixed(1)} km away from your current location.`;
      }
    }
    return null;
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Location
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Section */}
          <div className="space-y-2">
            <Label>Search for a location</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search area, street name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion.place_id)}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 text-sm"
                  >
                    {suggestion.description}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current Location Button */}
          <Button
            variant="outline"
            onClick={handleUseCurrentLocation}
            disabled={isLoading}
            className="w-full"
          >
            <Navigation className="h-4 w-4 mr-2" />
            {isLoading ? "Getting Location..." : "Use Current Location"}
          </Button>

          {/* Temporary Location Display */}
          {tempLocation && (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Selected Location</p>
                  <p className="text-xs text-gray-600">{tempLocationAddress}</p>
                </div>
              </div>

              {/* Service Status */}
              <div className="flex items-center gap-2">
                {isWithinServiceArea ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Badge variant="default" className="bg-green-600">
                      Available
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <Badge variant="destructive">
                      Out of Service Range
                    </Badge>
                  </>
                )}
              </div>

              <p className="text-xs text-gray-600">{getServiceMessage()}</p>
              
              {getDistanceMessage() && (
                <p className="text-xs text-blue-600">{getDistanceMessage()}</p>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleConfirmLocation}
                  disabled={!isWithinServiceArea}
                  className="flex-1"
                >
                  Confirm Location
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddAddressForm(true)}
                  disabled={!isWithinServiceArea}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          )}

          {/* Add Address Form */}
          {showAddAddressForm && (
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">Save This Address</h4>
              <div className="space-y-2">
                <Label htmlFor="address-label">Label</Label>
                <Input
                  id="address-label"
                  placeholder="e.g., Home, Office"
                  value={newAddressForm.label}
                  onChange={(e) => setNewAddressForm(prev => ({ ...prev, label: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddNewAddress} className="flex-1">
                  Save Address
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddAddressForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Saved Addresses */}
          {savedAddresses.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Saved Addresses</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {savedAddresses.map((address) => (
                    <div
                      key={address.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <button
                        onClick={() => handleSelectSavedAddress(address)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-sm">{address.label}</p>
                            <p className="text-xs text-gray-600 truncate">
                              {address.address}
                            </p>
                          </div>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};