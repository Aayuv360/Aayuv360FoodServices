import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRecoilState, useRecoilValue } from "recoil";
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
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";
import { useServiceArea } from "./use-service-area";
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
  const [isUpdateAddress, setIsUpdateAddress] = useState(false);
  const { user } = useAuth();
  const { checkServiceAvailability, getServiceMessage } = useServiceArea();

  const {
    data: addressesData = [],
    refetch: refetchSavedAddresses,
    isSuccess,
  } = useQuery<SavedAddress[]>({
    queryKey: ["/api/addresses"],
    queryFn: async () => {
      const res = await fetch("/api/addresses");
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to fetch addresses");
      }

      const addresses = await res.json();
      return addresses.map((addr: any) => ({
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
      }));
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) {
      setSavedAddresses([]);
      setSelectedAddress(null);
    } else {
      setSavedAddresses(addressesData);
    }
  }, [user, isSuccess]);

  useEffect(() => {
    if (activeLocation) {
      checkLocationServiceArea(activeLocation);
    }
  }, [activeLocation]);

  const getCurrentLocationAsync = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
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
    setIsUpdateAddress(true);
    try {
      const res = await apiRequest(method, url, addressData);
      const data = await res.json();
      setIsUpdateAddress(false);

      await refetchSavedAddresses().then((res) => {
        setSavedAddresses(res.data || []);
      });

      if (data.isDefault) {
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
    } catch (error) {
      setIsUpdateAddress(false);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "add"} address. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const deleteAddress = async (addressId: number) => {
    try {
      const response = await apiRequest(
        "DELETE",
        `/api/addresses/${addressId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to delete address");
      }

      await refetchSavedAddresses().then((res) => {
        setSavedAddresses(res.data || []);
      });

      if (selectedAddress?.id === addressId) {
        setSelectedAddress(null);
      }

      toast({
        title: "Address deleted",
        description: "Your delivery address has been deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete address:", error);
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const clearError = () => {
    setError(null);
  };

  return {
    currentLocation,
    selectedAddress,
    savedAddresses,
    activeLocation,
    isLoading,
    error,
    serviceArea,
    getCurrentLocation: getCurrentLocationAsync,
    selectAddress,
    selectCurrentLocation,
    addNewAddress,
    deleteAddress,
    refreshSavedAddresses: refetchSavedAddresses,
    clearError,
    checkLocationServiceArea,
    isUpdateAddress,
  };
};
