import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import {
  LocateFixed,
  MapPinned,
  AlertCircle,
  ArrowLeft,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useServiceArea } from "@/hooks/use-service-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocationManager } from "@/hooks/use-location-manager";
import { AddressForm } from "./AddrssForm";
import { LocationSearchInput } from "./LocationSearchInput";
import { GoogleMapDisplay } from "./GoogleMapDisplay";

const DEFAULT_COORDS = { lat: 17.406657556136498, lng: 78.48462445101225 };

interface NewAddressModalProps {
  addressModalOpen: boolean;
  setAddressModalOpen: (open: boolean) => void;
  setEditingAddress?: any;
  editingAddress?: any;
  addressModalAction: string;
}

export const NewAddressModal: React.FC<NewAddressModalProps> = ({
  addressModalOpen,
  setAddressModalOpen,
  setEditingAddress,
  editingAddress,
  addressModalAction,
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState<"map" | "form">("map");
  const [locationSearch, setLocationSearch] = useState("");
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const {
    addNewAddress,
    isUpdateAddress,
    getCurrentLocation,
    isLoading: locationLoading,
  } = useLocationManager();

  const [addressType, setAddressType] = useState(
    editingAddress?.name || "Home",
  );

  const { isWithinServiceArea, checkServiceAvailability, getServiceMessage } =
    useServiceArea();

  const [addressDetails, setAddressDetails] = useState({
    landmark: "",
  });

  const [currentMapLocation, setCurrentMapLocation] = useState<{
    lat: number;
    lng: number;
  }>(DEFAULT_COORDS);

  useEffect(() => {
    if (!isMobile) {
      setCurrentStep("form");
    } else {
      setCurrentStep("map");
    }
  }, [isMobile]);

  const reverseGeocode = (location: { lat: number; lng: number }) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const addressComponents = results[0].address_components;

        const getComponent = (type: string) =>
          addressComponents.find((c) => c.types.includes(type))?.long_name ||
          "";
        const landmarkParts: string[] = [];

        const priorityTypes = [
          "subpremise",
          "premise",
          "street_number",
          "route",
          "neighborhood",
          "sublocality",
          "sublocality_level_1",
        ];

        for (const type of priorityTypes) {
          const part = getComponent(type);
          if (part && !landmarkParts.includes(part)) {
            landmarkParts.push(part);
          }
        }

        const landmark = landmarkParts.join(", ");

        const locationSearchValue = results[0].formatted_address;
        setLocationSearch(locationSearchValue);
        setAddressDetails({
          landmark,
        });
      }
    });
  };

  const fetchSuggestions = (input: string) => {
    if (!window.google || !input) return;

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: "in" },
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

  const handleSuggestionClick = (placeId: string, description: string) => {
    const service = new window.google.maps.places.PlacesService(
      document.createElement("div"),
    );

    service.getDetails({ placeId }, (place, status) => {
      if (status === "OK" && place?.geometry?.location) {
        const loc = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        setCurrentMapLocation(loc);
        reverseGeocode(loc);
        checkServiceAvailability(loc);
        setLocationSearch(description);
        setSuggestions([]);
      }
    });
  };

  const handleGetCurrentLocation = async () => {
    try {
      const coords = await getCurrentLocation();
      checkServiceAvailability(coords);
      setCurrentMapLocation(coords);
      reverseGeocode(coords);
    } catch (error) {
      console.error("Error getting current location:", error);
    }
  };
  useEffect(() => {
    if (addressModalAction !== "addressEdit") {
      handleGetCurrentLocation();
    } else {
      const loc = {
        lat: editingAddress?.latitude,
        lng: editingAddress?.longitude,
      };

      setCurrentMapLocation(loc);
      checkServiceAvailability(loc);
      reverseGeocode(loc);
      setAddressType(editingAddress?.name || "Home");
    }
  }, [addressModalAction, addressModalOpen]);

  const handleConfirmLocation = () => {
    if (isMobile && isWithinServiceArea) {
      setCurrentStep("form");
    }
  };

  const handleBackToMap = () => {
    if (isMobile) {
      setCurrentStep("map");
    }
  };
  const handleSubmitAddress = (addressData: any) => {
    const finalAddressData = {
      ...addressData,
      latitude: currentMapLocation.lat,
      longitude: currentMapLocation.lng,
    };

    addNewAddress(
      editingAddress,
      setAddressModalOpen,
      setEditingAddress,
      finalAddressData,
    );
  };

  const renderMapStep = () => (
    <div className="flex flex-col h-full text-base sm:text-sm">
      <div className="flex items-center justify-between p-4 sm:p-2 border-b bg-white">
        <div className="font-bold flex items-center text-lg sm:text-lg gap-2">
          <MapPinned className="h-5 w-5 sm:h-4 sm:w-4" /> Location
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAddressModalOpen(false)}
          className="p-2 sm:p-1"
        >
          <X className="!h-5 !w-5 sm:h-4 sm:w-4" />
        </Button>
      </div>

      <div className="flex-1 p-4 sm:p-2 overflow-y-auto">
        <div className="float-right">
          <Button
            type="button"
            variant="link"
            onClick={handleGetCurrentLocation}
            className="text-sm sm:text-base font-semibold p-0"
            disabled={locationLoading}
          >
            <LocateFixed className="h-4 w-4 sm:h-3 sm:w-3" /> Detect Location
          </Button>
        </div>

        <LocationSearchInput
          locationSearch={locationSearch}
          setLocationSearch={setLocationSearch}
          suggestions={suggestions}
          fetchSuggestions={fetchSuggestions}
          handleSuggestionClick={handleSuggestionClick}
        />
        <div className="pt-4 sm:pt-2">
          <GoogleMapDisplay
            currentMapLocation={currentMapLocation}
            setCurrentMapLocation={setCurrentMapLocation}
            reverseGeocode={reverseGeocode}
            checkServiceAvailability={checkServiceAvailability}
          />
        </div>

        <div
          className={`p-3 sm:p-2 mt-4 sm:mt-2 rounded-lg border ${
            isWithinServiceArea
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 sm:h-3 sm:w-3" />
            <span className="text-sm sm:text-xs">{getServiceMessage()}</span>
          </div>
        </div>

        <div className="flex justify-end pt-4 sm:pt-2">
          <Button
            onClick={handleConfirmLocation}
            disabled={!isWithinServiceArea}
            className="w-full text-sm sm:text-xs"
          >
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );

  const renderFormStep = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToMap}
            className="p-2"
          >
            <ArrowLeft className="!h-5 !w-5" />
          </Button>
          <div className="font-bold text-lg">
            {addressModalAction === "addressEdit"
              ? "Edit Address"
              : "Add Address"}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAddressModalOpen(false)}
          className="p-2"
        >
          <X className="!h-5 !w-5" />
        </Button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="text-sm font-medium mb-1">Location:</div>
          <div className="text-sm text-gray-600">{locationSearch}</div>
        </div>
        <AddressForm
          editingAddress={editingAddress}
          user={user}
          addressType={addressType}
          setAddressType={setAddressType}
          addressDetails={addressDetails}
          setAddressDetails={setAddressDetails}
          isWithinServiceArea={isWithinServiceArea}
          isUpdateAddress={isUpdateAddress}
          addressModalAction={addressModalAction}
          onSubmit={handleSubmitAddress}
        />
      </div>
    </div>
  );

  const renderDesktopLayout = () => (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="font-bold text-xl">
          {addressModalAction === "addressEdit"
            ? "Edit Address"
            : "Add Address"}
        </div>

        <Button
          type="button"
          variant="link"
          onClick={handleGetCurrentLocation}
          className="text-sm font-semibold"
          disabled={locationLoading}
        >
          <LocateFixed className="h-5 w-5" /> Detect Location
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative space-y-2 relative z-[1]">
          <LocationSearchInput
            locationSearch={locationSearch}
            setLocationSearch={setLocationSearch}
            suggestions={suggestions}
            fetchSuggestions={fetchSuggestions}
            handleSuggestionClick={handleSuggestionClick}
          />

          <GoogleMapDisplay
            currentMapLocation={currentMapLocation}
            setCurrentMapLocation={setCurrentMapLocation}
            reverseGeocode={reverseGeocode}
            checkServiceAvailability={checkServiceAvailability}
            mapHeightClass="h-[300px] sm:h-[350px] md:h-[450px] lg:h-[500px]"
          />
        </div>

        <div className="space-y-4">
          {!isWithinServiceArea ? (
            <div className="m-auto">
              <div
                className={`p-3 rounded-lg border ${
                  isWithinServiceArea
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{getServiceMessage()}</span>
                </div>
              </div>
            </div>
          ) : (
            <AddressForm
              editingAddress={editingAddress}
              user={user}
              addressType={addressType}
              setAddressType={setAddressType}
              addressDetails={addressDetails}
              setAddressDetails={setAddressDetails}
              isWithinServiceArea={isWithinServiceArea}
              isUpdateAddress={isUpdateAddress}
              addressModalAction={addressModalAction}
              onSubmit={handleSubmitAddress}
            />
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile && addressModalOpen) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {currentStep === "map" && renderMapStep()}
        {currentStep === "form" && renderFormStep()}
      </div>
    );
  }

  return (
    <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
      <DialogContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl h-[75vh] max-h-[75vh] overflow-y-auto">
        {renderDesktopLayout()}
      </DialogContent>
    </Dialog>
  );
};
