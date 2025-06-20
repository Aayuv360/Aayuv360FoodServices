import { useState, useEffect, useCallback } from "react";
import { LocationCoords } from "./use-geolocation";
import { apiRequest } from "@/lib/queryClient";

export interface Kitchen {
  id: number;
  name: string;
  lat: number;
  lng: number;
  serviceRadius: number; // in kilometers
}

export interface ServiceAreaState {
  isWithinServiceArea: boolean;
  nearestKitchen: Kitchen | null;
  distance: number | null;
  isLoading: boolean;
  error: string | null;
}

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (
  coord1: LocationCoords,
  coord2: LocationCoords,
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers

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

export const useServiceArea = () => {
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [state, setState] = useState<ServiceAreaState>({
    isWithinServiceArea: false,
    nearestKitchen: null,
    distance: null,
    isLoading: false,
    error: null,
  });

  // Fetch available kitchens/service locations
  useEffect(() => {
    const fetchKitchens = async () => {
      try {
        const response = await apiRequest("GET", "/api/locations");
        const locations = await response.json();

        // Transform locations to kitchen format
        // For now, using Hyderabad center as default kitchen location
        const defaultKitchens: Kitchen[] = [
          {
            id: 1,
            name: "Hyderabad Central Kitchen",
            lat: 17.4034581,
            lng: 78.3146812,
            serviceRadius: 10, // 10km radius
          },
          // Add more kitchens as needed
        ];

        setKitchens(defaultKitchens);
      } catch (error) {
        console.error("Failed to fetch kitchen locations:", error);
        // Use default kitchen if API fails
        setKitchens([
          {
            id: 1,
            name: "Hyderabad Central Kitchen",
            lat: 17.4065,
            lng: 78.4772,
            serviceRadius: 10,
          },
        ]);
      }
    };

    fetchKitchens();
  }, []);

  const checkServiceAvailability = useCallback(
    (userLocation: LocationCoords) => {
      if (kitchens.length === 0) {
        setState({
          isWithinServiceArea: false,
          nearestKitchen: null,
          distance: null,
          isLoading: false,
          error: "No kitchen locations available",
        });
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        let nearestKitchen: Kitchen | null = null;
        let minDistance = Infinity;

        // Find the nearest kitchen and check if it's within service area
        kitchens.forEach((kitchen) => {
          const distance = calculateDistance(userLocation, {
            lat: kitchen.lat,
            lng: kitchen.lng,
          });

          if (distance < minDistance) {
            minDistance = distance;
            nearestKitchen = kitchen;
          }
        });

        const isWithinServiceArea = nearestKitchen
          ? minDistance <= nearestKitchen.serviceRadius
          : false;

        setState({
          isWithinServiceArea,
          nearestKitchen,
          distance: minDistance,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to check service availability",
        }));
      }
    },
    [kitchens],
  );

  const getServiceMessage = useCallback(() => {
    if (state.isLoading) return "Checking service availability...";
    if (state.error) return state.error;
    if (!state.nearestKitchen)
      return "Unable to determine service availability";

    if (state.isWithinServiceArea) {
      return `Great! We deliver to your location. You're ${state.distance?.toFixed(1)}km from our ${state.nearestKitchen.name}.`;
    } else {
      const maxRadius = state.nearestKitchen.serviceRadius;
      return `Sorry, we're not serving this location yet. We currently deliver within ${maxRadius}km of our ${state.nearestKitchen.name}. You're ${state.distance?.toFixed(1)}km away.`;
    }
  }, [state]);

  return {
    ...state,
    kitchens,
    checkServiceAvailability,
    getServiceMessage,
  };
};
