import React, { useEffect, useState } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { LocateFixed } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

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
  const [locationSearch, setLocationSearch] = useState("");
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [mapCenter, setMapCenter] = useState(centerHyderabad);
  const [markerPosition, setMarkerPosition] = useState(centerHyderabad);
  const [isServiceAvailable, setIsServiceAvailable] = useState(true);
  const [addressType, setAddressType] = useState(
    editingAddress?.name || "Home",
  );

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

        // Reverse geocode to get formatted address
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
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setMapCenter(loc);
            setMarkerPosition(loc);
            reverseGeocode(loc);
          },
          (error) => {
            console.error("Failed to get current location:", error);
          },
          { enableHighAccuracy: true },
        );
      }
    };

    initializeFromEditingAddress();
  }, [isLoaded, editingAddress]);

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
        setLocationSearch(description);
        setSuggestions([]);
      }
    });
  };
  useEffect(() => {
    if (!addressModalOpen) {
      setLocationSearch("");
      fetchSuggestions("");
    }
  }, [addressModalOpen]);
  if (!isLoaded) return <div>Loading map...</div>;
  function haversineDistance(
    loc1: { lat: number; lng: number },
    loc2: { lat: number; lng: number },
  ): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(loc2.lat - loc1.lat);
    const dLng = toRad(loc2.lng - loc1.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(loc1.lat)) *
        Math.cos(toRad(loc2.lat)) *
        Math.sin(dLng / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(coords);
        setMarkerPosition(coords);
        reverseGeocode(coords);
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
      <DialogContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl h-[70vh] max-h-[70vh] overflow-y-auto">
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
          >
            <LocateFixed className="h-5 w-5" /> Use Current Location
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Map + Search Section */}
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
                  }}
                />
              </GoogleMap>
            </div>
            <div className="w-full absolute bottom-0 bg-white text-white p-8"></div>
          </div>

          {!isServiceAvailable ? (
            <div className="flex items-center justify-center h-48 bg-yellow-50 rounded-lg shadow-md m-auto">
              <p className="text-yellow-800 text-xl font-semibold text-center px-6">
                📍⏳ We’re not serving this location yet — but we’re working on
                it! 🚀
              </p>
            </div>
          ) : (
            <div className="space-y-4">
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
                    className="w-full sm:w-auto"
                    onClick={() => setAddressModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={!isServiceAvailable}
                  >
                    Save Address
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
