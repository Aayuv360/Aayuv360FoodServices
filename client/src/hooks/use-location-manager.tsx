import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";
import { toast } from "./use-toast";
import { useRecoilState } from "recoil";
import {
  currentLocationState,
  selectedAddressState,
  savedAddressesState,
  locationLoadingState,
  locationErrorState,
  LocationCoords,
  SavedAddress,
} from "@/Recoil/recoil";

export const useLocationManager = () => {
  const [currentLocation, setCurrentLocation] =
    useRecoilState(currentLocationState);
  const [selectedAddress, setSelectedAddress] =
    useRecoilState(selectedAddressState);
  const [savedAddresses, setSavedAddresses] =
    useRecoilState(savedAddressesState);
  const [isLoading, setIsLoading] = useRecoilState(locationLoadingState);
  const [error, setError] = useRecoilState(locationErrorState);
  const [isUpdateAddress, setIsUpdateAddress] = useState(false);
  const { user } = useAuth();

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
    const handleDefaultOrCurrentLocation = async () => {
      if (!user) {
        setSavedAddresses([]);
        setSelectedAddress(null);
      } else {
        setSavedAddresses(addressesData);
        // const defaultAddress = addressesData?.find((item) => item.isDefault);

        // if (defaultAddress) {
        //   setSelectedAddress(defaultAddress);
        // }
      }
      try {
        const coords = await getCurrentLocationAsync();
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

        setSelectedAddress(location);
      } catch (err) {
        console.error("Auto-detect location failed:", err);
      }
    };

    handleDefaultOrCurrentLocation();
  }, [user, isSuccess]);

  const getCurrentLocationAsync = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 60000,
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
    isLoading,
    error,
    getCurrentLocation: getCurrentLocationAsync,
    selectAddress,
    selectCurrentLocation,
    addNewAddress,
    deleteAddress,
    refreshSavedAddresses: refetchSavedAddresses,
    clearError,
    isUpdateAddress,
  };
};
