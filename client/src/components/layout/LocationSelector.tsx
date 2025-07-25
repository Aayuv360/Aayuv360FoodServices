import React, { useState, useEffect, Fragment } from "react";
import {
  MapPin,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  X,
  AlertCircle,
  LocateFixed,
} from "lucide-react";
import {
  Dialog,
  Transition,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useLocationManager } from "@/hooks/use-location-manager";
import { useAuth } from "@/hooks/use-auth";
import { useServiceArea } from "@/hooks/use-service-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { NewAddressModal } from "@/components/Modals/NewAddressModal";
import DeleteAddressDialog from "../Modals/DeleteAddressDialog";
import { LocationSearchInput } from "../Modals/LocationSearchInput";
import { Button } from "@/components/ui/button";
import { useLoadScript } from "@react-google-maps/api";
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LIBRARIES,
} from "@/lib/location-constants";

const LocationSelector = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [isNewAddressModalOpen, setIsNewAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [addressModalAction, setAddressModalAction] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAddrModalOpen, setIsDeleteAddrModalOpen] = useState(false);
  const [deleteAddressData, setDeleteAddressData] = useState<any>(null);
  const [pendingAddress, setPendingAddress] = useState<any>(null);

  const isMobile = useIsMobile();
  const { user } = useAuth();
  const {
    selectedAddress,
    savedAddresses,
    selectAddress,
    getCurrentLocation,
    deleteAddress,
  } = useLocationManager();

  const { isWithinServiceArea, checkServiceAvailability, getServiceMessage } =
    useServiceArea();
  const [isPendingServiceable, setIsPendingServiceable] =
    useState<boolean>(true);

  useEffect(() => {
    if (pendingAddress?.coords) {
      const result = checkServiceAvailability(pendingAddress.coords);
      setIsPendingServiceable(!!result);
    } else {
      setIsPendingServiceable(true);
    }
  }, [pendingAddress]);

  useEffect(() => {
    if (selectedAddress?.coords) {
      checkServiceAvailability(selectedAddress.coords);
    }
  }, [selectedAddress]);

  if (loadError) return <div>Failed to load Google Maps</div>;
  if (!isLoaded) return <div>Loading map services...</div>;

  const getDisplayText = () => {
    if (selectedAddress?.address) {
      const addr = selectedAddress.address;
      return addr.length > 30 ? addr.slice(0, 30) + "..." : addr;
    }
    return "Select Location";
  };

  const fetchSuggestions = (input: string) => {
    if (!window.google || !input) return;
    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      { input, componentRestrictions: { country: "in" } },
      (predictions, status) => {
        if (status === "OK" && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      },
    );
  };

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

        setPendingAddress({
          id: Date.now(),
          label: "Search Result",
          address: suggestion.description,
          coords,
          pincode: "",
          isDefault: false,
        });

        setSearchInput("");
        setSuggestions([]);
      }
    });
  };

  const handleCurrentLocation = async () => {
    try {
      const coords = await getCurrentLocation();
      const geocoder = new window.google.maps.Geocoder();
      const results = await new Promise<google.maps.GeocoderResult[]>(
        (resolve, reject) => {
          geocoder.geocode({ location: coords }, (res, status) => {
            if (status === "OK" && res) resolve(res);
            else reject("Geocode failed");
          });
        },
      );
      const address =
        results[0]?.formatted_address || `${coords.lat}, ${coords.lng}`;
      setPendingAddress({
        id: Date.now(),
        label: "Current Location",
        address,
        coords,
        pincode: "",
        isDefault: false,
      });
    } catch (err) {
      console.error("Error detecting location:", err);
    }
  };

  const handleEditAddress = (addr: any) => {
    setEditingAddress(addr);
    setAddressModalAction("addressEdit");
    setIsNewAddressModalOpen(true);
    setIsDialogOpen(false);
  };

  const handleDeleteAddress = async (addressId: number) => {
    deleteAddress(addressId);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSearchInput("");
    setSuggestions([]);
    setPendingAddress(null);
  };

  return (
    <div>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="cursor-pointer gap-1 text-xs text-muted-foreground hover:text-primary transition flex items-center pt-2 px-2"
      >
        <MapPin className="h-4 w-4" />
        <span className="truncate font-medium">{getDisplayText()}</span>
        <ChevronDown className="h-3 w-3 ml-1" />
      </button>

      <Transition show={isDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeDialog}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </TransitionChild>

          <div
            className={`fixed inset-0 flex ${isMobile ? "items-end" : "items-center"} justify-center`}
          >
            <DialogPanel className="w-full sm:max-w-md overflow-y-auto">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-t-lg sm:rounded-md shadow-lg border p-4 flex flex-col min-h-[50vh] max-h-[90vh]"
              >
                <div className="flex justify-between items-center border-b pb-2 mb-3">
                  <div className="font-semibold text-sm">
                    Select Delivery Location
                  </div>
                  <button onClick={closeDialog}>
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="flex">
                  <Button
                    onClick={handleCurrentLocation}
                    variant="link"
                    className="py-2 ml-auto"
                  >
                    <LocateFixed className="!h-5 !w-5" />
                    Detect Location
                  </Button>
                </div>

                <LocationSearchInput
                  locationSearch={searchInput}
                  setLocationSearch={setSearchInput}
                  suggestions={suggestions}
                  fetchSuggestions={fetchSuggestions}
                  handleSuggestionClick={handlePlaceSelect}
                />

                <div className="flex-1 overflow-y-auto mt-2">
                  {savedAddresses.length > 0 && (
                    <>
                      <div className="mt-4 font-semibold text-xs">
                        Saved Addresses
                      </div>
                      {savedAddresses.map((address: any) => (
                        <div
                          key={address.id}
                          onClick={() =>
                            setPendingAddress({
                              id: address.id,
                              label: address.label || "Address",
                              address: `${address.addressLine1}, ${address.addressLine2 || ""}, ${address.city || ""}`,
                              coords: {
                                lat: address.latitude || 0,
                                lng: address.longitude || 0,
                              },
                              pincode: address.pincode,
                              isDefault: address.isDefault,
                              phone: address?.phone,
                            })
                          }
                          className="px-2 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-start text-sm"
                        >
                          <div>
                            <div className="font-semibold text-xs">
                              {address.label}
                              {address.isDefault && (
                                <Badge className="ml-2 !text-xs">Default</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {address.addressLine1}, {address.addressLine2}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Edit
                              className="h-4 w-4 text-muted-foreground hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAddress(address);
                              }}
                            />
                            <Trash2
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsDialogOpen(false);
                                setDeleteAddressData(address);
                                setIsDeleteAddrModalOpen(true);
                              }}
                              className="h-4 w-4 text-muted-foreground hover:text-destructive"
                            />
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {user && (
                    <div
                      className="mt-4 p-2 hover:bg-gray-100 cursor-pointer flex items-center text-sm"
                      onClick={() => {
                        setAddressModalAction("addressAdd");
                        setIsNewAddressModalOpen(true);
                        setIsDialogOpen(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Address
                    </div>
                  )}
                </div>

                {/* Bottom Confirm Section */}
                {pendingAddress && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    {!isPendingServiceable && (
                      <div className="py-2">
                        <div className="p-2 rounded-lg border text-xs bg-red-50 border-red-200 text-red-800">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span>{getServiceMessage()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mb-2">
                      <div className="font-semibold text-xs mb-1">
                        Selected Location:
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pendingAddress.address}
                      </div>
                    </div>
                    <Button
                      disabled={!isPendingServiceable}
                      onClick={() => {
                        selectAddress(pendingAddress);
                        setPendingAddress(null);
                        setIsDialogOpen(false);
                      }}
                      className="w-full"
                      variant={isPendingServiceable ? "default" : "secondary"}
                    >
                      {isPendingServiceable
                        ? "Confirm Location"
                        : "Not in Service Area"}
                    </Button>
                  </div>
                )}
              </motion.div>
            </DialogPanel>
          </div>
        </Dialog>
      </Transition>

      <NewAddressModal
        addressModalOpen={isNewAddressModalOpen}
        setAddressModalOpen={setIsNewAddressModalOpen}
        addressModalAction={addressModalAction}
        editingAddress={editingAddress}
        setEditingAddress={setEditingAddress}
      />

      <DeleteAddressDialog
        open={isDeleteAddrModalOpen}
        address={deleteAddressData}
        onCancel={() => {
          setIsDeleteAddrModalOpen(false);
          setDeleteAddressData(null);
        }}
        onConfirm={(id) => {
          handleDeleteAddress(id);
          setIsDeleteAddrModalOpen(false);
          setDeleteAddressData(null);
        }}
      />
    </div>
  );
};

export default LocationSelector;
