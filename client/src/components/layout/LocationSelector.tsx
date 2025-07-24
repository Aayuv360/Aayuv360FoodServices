import React, { useState, useEffect, Fragment } from "react";
import {
  MapPin,
  ChevronDown,
  Plus,
  Navigation,
  Search,
  Edit,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  Popover,
  Transition,
  PopoverButton,
  PopoverPanel,
  TransitionChild,
} from "@headlessui/react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocationManager } from "@/hooks/use-location-manager";
import { useAuth } from "@/hooks/use-auth";
import { useServiceArea } from "@/hooks/use-service-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { NewAddressModal } from "@/components/Modals/NewAddressModal";

import DeleteAddressDialog from "../Modals/DeleteAddressDialog";

const LocationSelector = () => {
  const [isNewAddressModalOpen, setIsNewAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [addressModalAction, setAddressModalAction] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState<any>(null);

  const isMobile = useIsMobile();
  const { user } = useAuth();
  const {
    selectedAddress,
    savedAddresses,
    selectAddress,
    isLoading: locationLoading,
    getCurrentLocation,
    deleteAddress,
  } = useLocationManager();

  const { isWithinServiceArea, checkServiceAvailability, getServiceMessage } =
    useServiceArea();

  useEffect(() => {
    if (selectedAddress?.coords) {
      checkServiceAvailability(selectedAddress.coords);
    }
  }, [selectedAddress]);

  useEffect(() => {
    if (!selectedAddress) {
      const timer = setTimeout(() => {
        handleCurrentLocation();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedAddress]);

  useEffect(() => {
    if (searchInput === "") setSuggestions([]);
  }, [searchInput]);

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
        const isServiceable = checkServiceAvailability(coords);
        if (!isServiceable) {
          return;
        }
        const tempAddress = {
          id: Date.now(),
          label: "Search Result",
          address: suggestion.description,
          coords,
          pincode: "",
          isDefault: false,
        };

        selectAddress(tempAddress);
        setSearchInput("");
        setSuggestions([]);
        isMobile ? setIsMobileDialogOpen(false) : setIsPopoverOpen(false);
      }
    });
  };

  const handleCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const coords = await getCurrentLocation();
      checkServiceAvailability(coords);

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
      const location = {
        id: Date.now(),
        label: "Current Location",
        address,
        coords,
        pincode: "",
        isDefault: false,
      };

      selectAddress(location);
      isMobile ? setIsMobileDialogOpen(false) : setIsPopoverOpen(false);
    } catch (err) {
      console.error("Error getting location", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAddress = (addr: any) => {
    setEditingAddress(addr);
    setAddressModalAction("addressEdit");
    setIsNewAddressModalOpen(true);
    setIsMobileDialogOpen(false);
  };
  const handleDeleteAddress = async (addressId: number) => {
    deleteAddress(addressId);
  };
  const renderLocationPanel = () => (
    <div className="bg-white rounded-t-lg sm:rounded-md shadow-lg border p-4">
      <div className="flex justify-between items-center border-b pb-2 mb-3">
        <div className="font-semibold text-sm">Select Delivery Location</div>
        <button
          onClick={() =>
            isMobile ? setIsMobileDialogOpen(false) : setIsPopoverOpen(false)
          }
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className={`${isMobile ? "py-2" : "py-2"}`}>
        <div
          className={`p-2 rounded-lg border text-xs ${
            isWithinServiceArea
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span
              className={`${isMobile ? "text-xs" : "text-xs"} leading-tight`}
            >
              {getServiceMessage()}
            </span>
          </div>
        </div>
      </div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search area, landmark..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            fetchSuggestions(e.target.value);
          }}
          className="pl-10"
        />
      </div>

      <div className="max-h-[50vh] overflow-y-auto">
        {suggestions.length > 0 && (
          <div className="mb-4">
            {suggestions.map((s) => (
              <div
                key={s.place_id}
                className="p-2 hover:bg-gray-100 cursor-pointer flex text-sm"
                onClick={() => handlePlaceSelect(s)}
              >
                <MapPin className="h-4 w-4 mr-2 mt-1 text-gray-400" />
                {s.description}
              </div>
            ))}
          </div>
        )}

        <div
          onClick={handleCurrentLocation}
          className="p-2 hover:bg-gray-100 cursor-pointer flex items-center text-sm"
        >
          <Navigation className="h-4 w-4 mr-2" />
          {isLoading || locationLoading
            ? "Getting location..."
            : "Use Current Location"}
        </div>

        {savedAddresses.length > 0 && (
          <>
            <div className="mt-4 mb-1 text-xs text-gray-500 uppercase">
              Saved Addresses
            </div>
            {savedAddresses.map((address: any) => (
              <div
                key={address.id}
                onClick={() =>
                  selectAddress({
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
                  <div className="font-medium">
                    {address.label}
                    {address.isDefault && (
                      <Badge className="ml-2 !text-xs">Default</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {address.addressLine1}, {address.addressLine2},{" "}
                    {address.city}
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
                      setIsMobileDialogOpen(false);
                      handleDeleteAddress(address.id);
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
              isMobile ? setIsMobileDialogOpen(false) : setIsPopoverOpen(false);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Address
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <div>
          <button
            onClick={() => setIsMobileDialogOpen(true)}
            className="cursor-pointer gap-1 text-xs text-muted-foreground hover:text-primary transition flex items-center pt-2 px-2"
          >
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate font-medium">{getDisplayText()}</span>
            <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
          </button>

          <Transition show={isMobileDialogOpen} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-50"
              onClose={() => setIsMobileDialogOpen(false)}
            >
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

              <div className="fixed inset-0 flex items-end justify-center">
                <Dialog.Panel className="w-full sm:max-w-md">
                  {renderLocationPanel()}
                </Dialog.Panel>
              </div>
            </Dialog>
          </Transition>
        </div>
      ) : (
        <Popover className="relative">
          <PopoverButton
            onClick={() => setIsPopoverOpen(true)}
            className="cursor-pointer text-sm text-muted-foreground hover:text-primary transition flex items-center mt-2 ml-4 focus-visible:outline-none"
          >
            <MapPin className="!h-5 !w-5 mb-1 mr-1" />
            <span className="truncate font-medium">{getDisplayText()}</span>
            <ChevronDown className="!h-5 !w-5 ml-1 flex-shrink-0" />
          </PopoverButton>
          {isPopoverOpen && (
            <PopoverPanel className="absolute z-50 mt-3 left-1/2 -translate-x-1/2">
              <div className="!w-[400px]">{renderLocationPanel()}</div>
            </PopoverPanel>
          )}
        </Popover>
      )}

      <NewAddressModal
        addressModalOpen={isNewAddressModalOpen}
        setAddressModalOpen={setIsNewAddressModalOpen}
        addressModalAction={addressModalAction}
        editingAddress={editingAddress}
        setEditingAddress={setEditingAddress}
      />
      <DeleteAddressDialog
        open={!!deletingAddress}
        address={deletingAddress}
        onCancel={() => setDeletingAddress(null)}
        onConfirm={(id) => {
          handleDeleteAddress(id);
          setDeletingAddress(null);
        }}
      />
    </>
  );
};

export default LocationSelector;
