import { useCallback, useState } from "react";
import { useKitchens } from "./use-commonServices";
interface LocationCoords {
  lat: number;
  lng: number;
}
export interface Kitchen {
  id: number;
  area: string;
  pincode: string;
  deliveryFee: number;
  lnt: number;
  lng: number;
  serviceRadius: number;
}

export interface ServiceAreaState {
  isWithinServiceArea: boolean;
  nearestKitchen: Kitchen | null;
  distance: number | null;
  isLoading: boolean;
  error: string | null;
}

const calculateDistance = (
  coord1: LocationCoords,
  coord2: LocationCoords,
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useServiceArea = () => {
  const {
    data: kitchens = [],
    isLoading: isKitchensLoading,
    error: kitchensError,
  } = useKitchens();

  const [state, setState] = useState<ServiceAreaState>({
    isWithinServiceArea: false,
    nearestKitchen: null,
    distance: null,
    isLoading: false,
    error: null,
  });

  const checkServiceAvailability = useCallback(
    (userLocation: LocationCoords) => {
      if (isKitchensLoading) {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));
        return;
      }

      if (kitchensError || kitchens.length === 0) {
        setState({
          isWithinServiceArea: false,
          nearestKitchen: null,
          distance: null,
          isLoading: false,
          error: kitchensError?.message || "No kitchen locations available",
        });
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        let nearestKitchen: Kitchen | null = null;
        let minDistance = Infinity;
        kitchens.forEach((kitchen) => {
          const distance = calculateDistance(userLocation, {
            lat: kitchen.lnt,
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
    [kitchens, isKitchensLoading, kitchensError],
  );

  const getServiceMessage = useCallback(() => {
    if (state.isLoading) return "Checking service availability...";
    if (state.error) return state.error;
    if (!state.nearestKitchen)
      return "Unable to determine service availability";

    if (state.isWithinServiceArea) {
      return `Great! We deliver to your location. You're ${state.distance?.toFixed(
        1,
      )}km from our ${state.nearestKitchen.area}.`;
    } else {
      const maxRadius = state.nearestKitchen.serviceRadius;
      return `Sorry, we're not serving this location yet. We currently deliver within ${maxRadius}km of our ${state.nearestKitchen.area} Central Kitchen. You're ${state.distance?.toFixed(
        1,
      )}km away.`;
    }
  }, [state]);

  return {
    ...state,
    kitchens,
    isKitchensLoading,
    kitchensError,
    checkServiceAvailability,
    getServiceMessage,
  };
};
