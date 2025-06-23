import React, { useEffect, useState } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { LocateFixed, Loader2, AlertCircle, ArrowLeft, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useServiceArea } from "@/hooks/use-service-area";
import { useIsMobile } from "@/hooks/use-mobile";

const libraries = ["places"];

const centerHyderabad = { lat: 17.385044, lng: 78.486671 };

interface Address {
  name?: string;
  phone?: string;
  userName?: string;
  addressLine1?: string;
  addressLine2?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

interface NewAddressModalProps {
  addressModalOpen: boolean;
  setAddressModalOpen: (open: boolean) => void;
  handleAddressFormSubmit: (data: any) => void;
  editingAddress?: any;
  addressModalAction: string;
}

export const NewAddressModal: React.FC<NewAddressModalProps> = ({
  addressModalOpen,
  setAddressModalOpen,
  handleAddressFormSubmit,
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
  const [mapCenter, setMapCenter] = useState(centerHyderabad);
  const [markerPosition, setMarkerPosition] = useState(centerHyderabad);
  const [addressType, setAddressType] = useState(
    editingAddress?.name || "Home",
  );

  const {
    coords,
    isLoading: geoLoading,
    getCurrentPosition,
    error: geoError,
  } = useGeolocation();
  const {
    isWithinServiceArea,
    checkServiceAvailability,
    getServiceMessage,
    isLoading: serviceLoading,
  } = useServiceArea();

  const [addressDetails, setAddressDetails] = useState({
    landmark: "",
  });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAnwH0jPc54BR-sdRBybXkwIo5QjjGceSI",
    libraries: libraries as any,
  });

  useEffect(() => {
    if (!isLoaded) return;

    const initializeFromEditingAddress = async () => {
      if (editingAddress) {
        const loc = {
          lat: editingAddress.latitude || centerHyderabad.lat,
          lng: editingAddress.longitude || centerHyderabad.lng,
        };
        setMapCenter(loc);
        setMarkerPosition(loc);
        checkServiceAvailability(loc);

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: loc }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            setLocationSearch(results[0].formatted_address || "");
          }
        });

        setAddressDetails({
          landmark: editingAddress.addressLine2 || "",
        });
        setAddressType(editingAddress.name || "Home");
      } else {
        getCurrentPosition();
      }
    };

    initializeFromEditingAddress();
  }, [isLoaded, editingAddress, getCurrentPosition, checkServiceAvailability]);

  useEffect(() => {
    if (coords && !editingAddress) {
      setMapCenter(coords);
      setMarkerPosition(coords);
      reverseGeocode(coords);
      checkServiceAvailability(coords);
    }
  }, [coords, editingAddress, checkServiceAvailability]);

  useEffect(() => {
    if (!addressModalOpen) {
      setLocationSearch("");
      fetchSuggestions("");
      setCurrentStep("map");
    }
  }, [addressModalOpen]);

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
        setMapCenter(loc);
        setMarkerPosition(loc);
        reverseGeocode(loc);
        checkServiceAvailability(loc);
        setLocationSearch(description);
        setSuggestions([]);
      }
    });
  };

  if (!isLoaded) return <div>Loading map...</div>;

  const handleGetCurrentLocation = () => {
    getCurrentPosition();
  };

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

  const renderMapStep = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddressModalOpen(false)}
            className="p-2"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="font-bold text-lg">Select Location</div>
        </div>
        <Button
          type="button"
          variant="link"
          onClick={handleGetCurrentLocation}
          className="text-sm"
          disabled={geoLoading}
        >
          {geoLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              <LocateFixed className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="relative">
          <Input
            className="w-full"
            placeholder="Search for your location"
            value={locationSearch}
            onChange={(e) => {
              const val = e.target.value;
              setLocationSearch(val);
              fetchSuggestions(val);
            }}
          />

          {locationSearch !== "" && suggestions.length > 0 && (
            <div className="absolute z-50 w-full bg-white shadow-md border rounded-md max-h-[200px] overflow-y-auto mt-1">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() =>
                    handleSuggestionClick(
                      suggestion.place_id,
                      suggestion.description,
                    )
                  }
                >
                  {suggestion.description}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full h-[300px] rounded-lg overflow-hidden">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={mapCenter}
            zoom={18}
            options={{
              clickableIcons: false,
              gestureHandling: "greedy",
              mapTypeControl: false,
              streetViewControl: false,
            }}
          >
            <Marker
              position={markerPosition}
              draggable
              onDragEnd={(e) => {
                const latLng = e.latLng;
                if (!latLng) return;
                const newLoc = {
                  lat: latLng.lat(),
                  lng: latLng.lng(),
                };
                setMarkerPosition(newLoc);
                setMapCenter(newLoc);
                reverseGeocode(newLoc);
                checkServiceAvailability(newLoc);
              }}
            />
          </GoogleMap>
        </div>

        {(serviceLoading || geoError) && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2">
              {serviceLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              )}
              {geoError && <AlertCircle className="h-4 w-4 text-red-600" />}
              <span className="text-sm">
                {serviceLoading && "Checking service availability..."}
                {geoError && geoError}
              </span>
            </div>
          </div>
        )}

        {markerPosition !== centerHyderabad && (
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
        )}

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleConfirmLocation}
            disabled={
              !isWithinServiceArea || markerPosition === centerHyderabad
            }
            className="w-full"
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
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToMap}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
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
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="text-sm font-medium mb-1">Selected Location:</div>
          <div className="text-sm text-gray-600">{locationSearch}</div>
          {markerPosition && (
            <div className="text-xs text-gray-500 mt-1">
              Lat: {markerPosition.lat.toFixed(4)}, Lng:{" "}
              {markerPosition.lng.toFixed(4)}
            </div>
          )}
        </div>

        <form
          id="address-form"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const addressData = {
              name: formData.get("addressName") as string,
              phone: formData.get("phone") as string,
              addressLine1: formData.get("addressLine1") as string,
              addressLine2:
                (formData.get("addressLine2") as string) || undefined,
              isDefault: Boolean(formData.get("isDefault")),
              userName: formData.get("userName") as string,
              latitude: markerPosition.lat,
              longitude: markerPosition.lng,
              nearbyLandmark: formData.get("nearbyLandmark") as string,
            };

            handleAddressFormSubmit(addressData);
          }}
          className="space-y-4"
        >
          <div className="flex flex-wrap gap-2">
            {["Home", "Office", "Hotel", "Others"].map((label) => (
              <Button
                key={label}
                type="button"
                className={`w-full sm:w-auto rounded-2xl ${addressType !== label && "bg-white hover:text-gray-700 hover:bg-orange-100"}`}
                variant={addressType === label ? "default" : "outline"}
                onClick={() => setAddressType(label)}
              >
                {label}
              </Button>
            ))}
            <input type="hidden" name="addressName" value={addressType} />
          </div>

          <div>
            <Label>Flat No. / House / Building name</Label>
            <Input
              className="w-full"
              name="addressLine1"
              placeholder="Flat No./House/Building name"
              defaultValue={editingAddress?.addressLine1 || ""}
              required
            />
          </div>

          <div>
            <Label>Area / Locality</Label>
            <Input
              className="w-full"
              name="addressLine2"
              placeholder="Landmark, Area, Locality, etc."
              value={addressDetails.landmark}
              onChange={(e) =>
                setAddressDetails((prev) => ({
                  ...prev,
                  landmark: e.target.value,
                }))
              }
              readOnly
            />
          </div>
          <div>
            <Label>Near by landmark</Label>
            <Input
              className="w-full"
              name="nearbyLandmark"
              placeholder="Near by landmark"
              defaultValue={editingAddress?.nearbyLandmark || ""}
            />
          </div>

          <div className="text-primary">
            Provide your information for delivery
          </div>
          <div className="!mt-1">
            <Label>Name</Label>
            <Input
              className="w-full"
              name="userName"
              placeholder="Your name"
              defaultValue={editingAddress?.userName || user?.username || ""}
              required
            />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input
              className="w-full"
              name="phone"
              placeholder="10-digit mobile number"
              defaultValue={editingAddress?.phone || ""}
              required
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={!isWithinServiceArea}
            >
              {addressModalAction === "addressEdit"
                ? "Update Address"
                : "Save Address"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderDesktopLayout = () => (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="font-bold text-xl">
          {addressModalAction === "addressEdit"
            ? "Edit Delivery Address"
            : "Add New Delivery Address"}
        </div>

        <Button
          type="button"
          variant="link"
          onClick={handleGetCurrentLocation}
          className="text-sm"
          disabled={geoLoading}
        >
          {geoLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Getting location...
            </>
          ) : (
            <>
              <LocateFixed className="h-5 w-5" /> Use Current Location
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative space-y-2 relative z-[1]">
          <div className="relative">
            <Input
              className="w-full"
              placeholder="Search for your location"
              value={locationSearch}
              onChange={(e) => {
                const val = e.target.value;
                setLocationSearch(val);
                fetchSuggestions(val);
              }}
            />

            {locationSearch !== "" && suggestions.length > 0 && (
              <div className="absolute z-50 w-full bg-white shadow-md border rounded-md max-h-[200px] overflow-y-auto mt-1">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.place_id}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() =>
                      handleSuggestionClick(
                        suggestion.place_id,
                        suggestion.description,
                      )
                    }
                  >
                    {suggestion.description}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px]">
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={mapCenter}
              zoom={18}
              options={{
                clickableIcons: false,
                gestureHandling: "greedy",
                mapTypeControl: false,
                streetViewControl: false,
              }}
            >
              <Marker
                position={markerPosition}
                draggable
                onDragEnd={(e) => {
                  const latLng = e.latLng;
                  if (!latLng) return;
                  const newLoc = {
                    lat: latLng.lat(),
                    lng: latLng.lng(),
                  };
                  setMarkerPosition(newLoc);
                  setMapCenter(newLoc);
                  reverseGeocode(newLoc);
                  checkServiceAvailability(newLoc);
                }}
              />
            </GoogleMap>
          </div>
        </div>

        <div className="space-y-4">
          {(serviceLoading || geoError) && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2">
                {serviceLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
                {geoError && <AlertCircle className="h-4 w-4 text-red-600" />}
                <span className="text-sm">
                  {serviceLoading && "Checking service availability..."}
                  {geoError && geoError}
                </span>
              </div>
            </div>
          )}

          {markerPosition !== centerHyderabad && (
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
          )}

          {!isWithinServiceArea && markerPosition !== centerHyderabad ? (
            <div className="flex items-center justify-center h-32 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-yellow-800 text-center px-4">
                We're not serving this location yet, but we're working on
                expanding our coverage area.
              </p>
            </div>
          ) : (
            <form
              id="address-form"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const addressData = {
                  name: formData.get("addressName") as string,
                  phone: formData.get("phone") as string,
                  addressLine1: formData.get("addressLine1") as string,
                  addressLine2:
                    (formData.get("addressLine2") as string) || undefined,
                  isDefault: Boolean(formData.get("isDefault")),
                  userName: formData.get("userName") as string,
                  latitude: markerPosition.lat,
                  longitude: markerPosition.lng,
                  nearbyLandmark: formData.get("nearbyLandmark") as string,
                };

                handleAddressFormSubmit(addressData);
              }}
              className="space-y-4"
            >
              <div className="flex flex-wrap gap-2">
                {["Home", "Office", "Hotel", "Others"].map((label) => (
                  <Button
                    key={label}
                    type="button"
                    className={`w-full sm:w-auto rounded-2xl ${addressType !== label && "bg-white hover:text-gray-700 hover:bg-orange-100"}`}
                    variant={addressType === label ? "default" : "outline"}
                    onClick={() => setAddressType(label)}
                  >
                    {label}
                  </Button>
                ))}
                <input type="hidden" name="addressName" value={addressType} />
              </div>

              <div>
                <Label>Flat No. / House / Building name</Label>
                <Input
                  className="w-full"
                  name="addressLine1"
                  placeholder="Flat No./House/Building name"
                  defaultValue={editingAddress?.addressLine1 || ""}
                  required
                />
              </div>

              <div>
                <Label>Area / Locality</Label>
                <Input
                  className="w-full"
                  name="addressLine2"
                  placeholder="Landmark, Area, Locality, etc."
                  value={addressDetails.landmark}
                  onChange={(e) =>
                    setAddressDetails((prev) => ({
                      ...prev,
                      landmark: e.target.value,
                    }))
                  }
                  readOnly
                />
              </div>
              <div>
                <Label>Near by landmark</Label>
                <Input
                  className="w-full"
                  name="nearbyLandmark"
                  placeholder="Near by landmark"
                  defaultValue={editingAddress?.nearbyLandmark || ""}
                />
              </div>

              <div className="text-primary">
                Provide your information for delivery
              </div>
              <div className="!mt-1">
                <Label>Name</Label>
                <Input
                  className="w-full"
                  name="userName"
                  placeholder="Your name"
                  defaultValue={
                    editingAddress?.userName || user?.username || ""
                  }
                  required
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  className="w-full"
                  name="phone"
                  placeholder="10-digit mobile number"
                  defaultValue={editingAddress?.phone || ""}
                  required
                />
              </div>

              <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddressModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!isWithinServiceArea}>
                  {addressModalAction === "addressEdit"
                    ? "Update Address"
                    : "Save Address"}
                </Button>
              </DialogFooter>
            </form>
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
      <DialogContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl h-[70vh] max-h-[70vh] overflow-y-auto">
        {renderDesktopLayout()}
      </DialogContent>
    </Dialog>
  );
};
