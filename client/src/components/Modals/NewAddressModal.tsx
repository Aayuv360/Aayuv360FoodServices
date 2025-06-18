import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  Marker,
  useLoadScript,
  Autocomplete,
} from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Home,
  Briefcase,
  Hotel,
  MoreHorizontal,
  LocateFixed,
} from "lucide-react";
import { Label } from "@/components/ui/label";

const libraries = ["places"];
const mapContainerStyle = {
  width: "100%",
  height: "300px",
};
const centerHyderabad = { lat: 17.385044, lng: 78.486671 };
const allowedPostalCodes = ["500075"];

export const NewAddressModal = ({
  addressModalOpen,
  setAddressModalOpen,
  handleAddressFormSubmit,
  editingAddress,
}: any) => {
  const [locationSearch, setLocationSearch] = useState("");
  const [mapCenter, setMapCenter] = useState(centerHyderabad);
  const [markerPosition, setMarkerPosition] = useState(centerHyderabad);
  const [isServiceAvailable, setIsServiceAvailable] = useState(true);
  const [addressDetails, setAddressDetails] = useState({
    city: "Hyderabad",
    state: "Telangana",
    pincode: "",
    landmark: "",
  });
  const [addressType, setAddressType] = useState(
    editingAddress?.name || "Home",
  );

  const autocompleteRef = useRef<any>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAnwH0jPc54BR-sdRBybXkwIo5QjjGceSI",
    libraries: libraries as any,
  });

  useEffect(() => {
    if (!isLoaded) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(loc);
        setMarkerPosition(loc);
        reverseGeocode(loc);
      });
    }
  }, [isLoaded]);

  const reverseGeocode = (location: { lat: number; lng: number }) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const addressComponents = results[0].address_components;
        const getComponent = (type: string) =>
          addressComponents.find((c) => c.types.includes(type))?.long_name ||
          "";

        const pincode = getComponent("postal_code");
        const isAllowed = allowedPostalCodes.includes(pincode);
        setIsServiceAvailable(isAllowed);

        setAddressDetails({
          city: getComponent("locality"),
          state: getComponent("administrative_area_level_1"),
          pincode: pincode,
          landmark: results[0].formatted_address,
        });
      }
    });
  };

  const geocodePincode = (pincode: string) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: pincode }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location;
        const loc = {
          lat: location.lat(),
          lng: location.lng(),
        };
        setMapCenter(loc);
        setMarkerPosition(loc);
        reverseGeocode(loc);
      }
    });
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const loc = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setMapCenter(loc);
        setMarkerPosition(loc);
        reverseGeocode(loc);
      }
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>
            {editingAddress
              ? "Edit Delivery Address"
              : "Add New Delivery Address"}
          </DialogTitle>
          <DialogDescription>
            Search for your location on the map or enter address details
            manually.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-2 relative z-[1]">
            <div>
              <Autocomplete
                onLoad={(auto) => (autocompleteRef.current = auto)}
                onPlaceChanged={onPlaceChanged}
                restrictions={{ country: "in" }}
              >
                <Input
                  placeholder="Search for your location"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                />
              </Autocomplete>

              <Button
                type="button"
                variant="link"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((position) => {
                      const loc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                      };
                      setMapCenter(loc);
                      setMarkerPosition(loc);
                      reverseGeocode(loc);
                    });
                  }
                }}
                className="text-sm"
              >
                <LocateFixed className="h-4 w-4 mr-2" /> Use Current Location
              </Button>
            </div>

            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={15}
              options={{ clickableIcons: false }}
            >
              <Marker
                position={markerPosition}
                draggable
                onDragEnd={(e) => {
                  const newLoc = {
                    lat: e.latLng?.lat() || 0,
                    lng: e.latLng?.lng() || 0,
                  };
                  setMarkerPosition(newLoc);
                  setMapCenter(newLoc);
                  reverseGeocode(newLoc);
                }}
              />
            </GoogleMap>

            {!isServiceAvailable && (
              <p className="text-red-500 text-sm mt-2">
                We are not providing services in this location yet. Coming
                soon... we will let you know.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <form
              id="address-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddressFormSubmit(e);
              }}
              className="space-y-4"
            >
              <div className="flex gap-2">
                {"Home,Office,Hotel,Others".split(",").map((label) => (
                  <Button
                    key={label}
                    type="button"
                    variant={addressType === label ? "default" : "outline"}
                    onClick={() => setAddressType(label)}
                  >
                    {label}
                  </Button>
                ))}
                <input type="hidden" name="addressName" value={addressType} />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  name="phone"
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input name="name" placeholder="Your name" required />
              </div>
              <div>
                <Label>Address Line 1</Label>
                <Input
                  name="addressLine1"
                  placeholder="House/Flat No., Street, Locality"
                  required
                />
              </div>

              <div>
                <Label>Landmark</Label>
                <Input
                  name="addressLine2"
                  placeholder="Landmark, Area, etc."
                  value={addressDetails.landmark}
                  onChange={(e) =>
                    setAddressDetails((prev) => ({
                      ...prev,
                      landmark: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    name="city"
                    value={addressDetails.city}
                    readOnly
                    required
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    name="state"
                    value={addressDetails.state}
                    readOnly
                    required
                  />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input
                    name="pincode"
                    value={addressDetails.pincode}
                    onChange={(e) => {
                      const newPincode = e.target.value;
                      setAddressDetails((prev) => ({
                        ...prev,
                        pincode: newPincode,
                      }));
                      if (/^\d{6}$/.test(newPincode)) {
                        geocodePincode(newPincode);
                      }
                    }}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddressModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!isServiceAvailable}>
                  Save Address
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
