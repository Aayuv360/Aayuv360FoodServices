import { useCallback, useEffect } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  currentLocationState,
  selectedAddressState,
  savedAddressesState,
  locationLoadingState,
  locationErrorState,
  serviceAreaState,
  activeLocationState,
  LocationCoords,
  SavedAddress,
} from "@/Recoil/recoil";
import { useGeolocation } from "./use-geolocation";
import { useServiceArea } from "./use-service-area";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";

const calculateDistance = (
  coord1: LocationCoords,
  coord2: LocationCoords,
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useLocationManager = () => {
  const [currentLocation, setCurrentLocation] =
    useRecoilState(currentLocationState);
  const [selectedAddress, setSelectedAddress] =
    useRecoilState(selectedAddressState);
  const [savedAddresses, setSavedAddresses] =
    useRecoilState(savedAddressesState);
  const [isLoading, setIsLoading] = useRecoilState(locationLoadingState);
  const [error, setError] = useRecoilState(locationErrorState);
  const [serviceArea, setServiceArea] = useRecoilState(serviceAreaState);
  const activeLocation = useRecoilValue(activeLocationState);

  const { user } = useAuth();
  const { getCurrentPosition } = useGeolocation();
  const { checkServiceAvailability, getServiceMessage } = useServiceArea();

  useEffect(() => {
    if (user) {
      loadSavedAddresses();
    } else {
      setSavedAddresses([]);
      setSelectedAddress(null);
    }
  }, [user]);

  useEffect(() => {
    if (activeLocation) {
      checkLocationServiceArea(activeLocation);
    }
  }, [activeLocation, checkServiceAvailability]);

  const loadSavedAddresses = async () => {
    try {
      const response = await apiRequest("GET", "/api/addresses");
      if (response.ok) {
        const addresses = await response.json();
        const formattedAddresses: SavedAddress[] = addresses.map(
          (addr: any) => ({
            id: addr.id,
            label: addr.label || "Home",
            address: addr.address,
            coords: {
              lat: addr.latitude,
              lng: addr.longitude,
            },
            pincode: addr.pincode,
            isDefault: addr.isDefault,
          }),
        );
        setSavedAddresses(formattedAddresses);

        const defaultAddress = formattedAddresses.find(
          (addr) => addr.isDefault,
        );
        if (defaultAddress && !selectedAddress) {
          setSelectedAddress(defaultAddress);
        }
      }
    } catch (error) {
      console.error("Failed to load saved addresses:", error);
    }
  };

  const getCurrentLocationAsync = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          });
        },
      );

      const coords: LocationCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setCurrentLocation(coords);
      setIsLoading(false);
      return coords;
    } catch (error: any) {
      let errorMessage = "Unable to get current location";
      if (error.code === 1) {
        errorMessage =
          "Location access denied. Please enable location permissions.";
      } else if (error.code === 2) {
        errorMessage = "Location information is unavailable.";
      } else if (error.code === 3) {
        errorMessage = "Location request timed out.";
      }

      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [setCurrentLocation, setIsLoading, setError]);

  const checkLocationServiceArea = useCallback(
    async (location: LocationCoords) => {
      try {
        checkServiceAvailability(location);

        let distanceFromCurrent = null;
        if (currentLocation && selectedAddress) {
          distanceFromCurrent = calculateDistance(currentLocation, location);
        }

        setServiceArea({
          isWithinServiceArea: true,
          distanceFromCurrent,
          serviceMessage: getServiceMessage(),
        });
      } catch (error) {
        console.error("Failed to check service area:", error);
      }
    },
    [
      checkServiceAvailability,
      currentLocation,
      selectedAddress,
      getServiceMessage,
      setServiceArea,
    ],
  );

  const selectAddress = (address: SavedAddress) => {
    setSelectedAddress(address);
    setError(null);
  };

  const selectCurrentLocation = async () => {
    try {
      const coords = await getCurrentLocationAsync();
      setSelectedAddress(null); // Clear selected address to use current location
      return coords;
    } catch (error) {
      throw error;
    }
  };

  const addNewAddress = async (addressData: {
    label: string;
    address: string;
    coords: LocationCoords;
    pincode?: string;
    isDefault?: boolean;
  }) => {
    try {
      const response = await apiRequest("POST", "/api/addresses", {
        label: addressData.label,
        address: addressData.address,
        latitude: addressData.coords.lat,
        longitude: addressData.coords.lng,
        pincode: addressData.pincode,
        isDefault: addressData.isDefault,
      });

      if (response.ok) {
        const newAddress = await response.json();
        const formattedAddress: SavedAddress = {
          id: newAddress.id,
          label: newAddress.label,
          address: newAddress.address,
          coords: {
            lat: newAddress.latitude,
            lng: newAddress.longitude,
          },
          pincode: newAddress.pincode,
          isDefault: newAddress.isDefault,
        };

        setSavedAddresses((prev) => [...prev, formattedAddress]);

        if (addressData.isDefault) {
          setSelectedAddress(formattedAddress);
        }

        return formattedAddress;
      } else {
        throw new Error("Failed to save address");
      }
    } catch (error) {
      console.error("Failed to add new address:", error);
      throw error;
    }
  };

  const deleteAddress = async (addressId: number) => {
    try {
      const response = await apiRequest(
        "DELETE",
        `/api/addresses/${addressId}`,
      );
      if (response.ok) {
        setSavedAddresses((prev) =>
          prev.filter((addr) => addr.id !== addressId),
        );

        // If deleted address was selected, clear selection
        if (selectedAddress?.id === addressId) {
          setSelectedAddress(null);
        }
      } else {
        throw new Error("Failed to delete address");
      }
    } catch (error) {
      console.error("Failed to delete address:", error);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    // State
    currentLocation,
    selectedAddress,
    savedAddresses,
    activeLocation,
    isLoading,
    error,
    serviceArea,

    // Actions
    getCurrentLocation: getCurrentLocationAsync,
    selectAddress,
    selectCurrentLocation,
    saveAddress: addNewAddress,
    deleteAddress,
    loadSavedAddresses,
    refreshSavedAddresses: loadSavedAddresses,
    clearError,
    checkLocationServiceArea,
  };
};
