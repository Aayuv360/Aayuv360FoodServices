import { useCallback, useEffect, useState } from "react";
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
import { toast } from "./use-toast";

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
            label: addr.name || "Saved",
            address: [addr.addressLine1, addr.addressLine2]
              .filter(Boolean)
              .join(", "),
            coords: {
              lat: addr.latitude,
              lng: addr.longitude,
            },
            isDefault: addr.isDefault,
            phone: addr.phone,
            ...addr,
          }),
        );

        setSavedAddresses(formattedAddresses);

        const defaultAddress =
          formattedAddresses.find((a) => a.isDefault) || formattedAddresses[0];
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to load addresses:", errorText);
      }
    } catch (error) {
      console.error("Error loading saved addresses:", error);
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
      setSelectedAddress(null);
      return coords;
    } catch (error) {
      throw error;
    }
  };

  const addNewAddress = async (
    editingAddress: any,
    setAddressModalOpen: any,
    setEditingAddress: any,
    addressData: {
      addressLine1: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      isDefault?: boolean;
      nearbyLandmark?: string;
      phone: string;
      name: string;
      userName: string;
      latitude: number;
      longitude: number;
    },
  ) => {
    const isEditing = editingAddress !== null;
    const method = isEditing ? "PATCH" : "POST";
    const url = isEditing
      ? `/api/addresses/${editingAddress.id}`
      : "/api/addresses";

    apiRequest(method, url, {
      name: addressData.name,
      phone: addressData.phone,
      userName: addressData.userName,
      addressLine1: addressData.addressLine1,
      addressLine2: addressData.addressLine2,
      isDefault: addressData.isDefault,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      nearbyLandmark: addressData.nearbyLandmark,
    })
      .then((res) => res.json())
      .then((data) => {
        const formattedAddress: SavedAddress = {
          id: data.id,
          label: data.name || "Saved",
          address: [data.addressLine1, data.addressLine2]
            .filter(Boolean)
            .join(", "),
          coords: {
            lat: data.latitude,
            lng: data.longitude,
          },
          isDefault: data.isDefault,
          phone: data.phone,
          ...data,
        };

        if (isEditing) {
          setSavedAddresses((prev) =>
            prev.map((addr) =>
              addr.id === editingAddress.id ? formattedAddress : addr,
            ),
          );
        } else {
          setSavedAddresses((prev) => [...prev, formattedAddress]);
        }

        if (data.isDefault) {
          setSelectedAddress(formattedAddress);
        }

        setAddressModalOpen(false);
        setEditingAddress(null);

        toast({
          title: isEditing ? "Address updated" : "Address added",
          description: isEditing
            ? "Your delivery address has been updated successfully."
            : "Your new delivery address has been added successfully.",
          variant: "default",
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: `Failed to ${isEditing ? "update" : "add"} address. Please try again.`,
          variant: "destructive",
        });
      });
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
        toast({
          title: "Address deleted",
          description: "Your delivery address has been deleted successfully.",
          variant: "default",
        });
      } else {
        throw new Error("Failed to delete address");
      }
    } catch (error) {
      console.error("Failed to delete address:", error);
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      });
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
    addNewAddress,
    deleteAddress,
    loadSavedAddresses,
    refreshSavedAddresses: loadSavedAddresses,
    clearError,
    checkLocationServiceArea,
  };
};
