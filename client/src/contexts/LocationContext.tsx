import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useGeolocation, LocationCoords } from "../hooks/use-geolocation";
import { useServiceArea } from "../hooks/use-service-area";

interface LocationContextType {
  currentLocation: LocationCoords | null;
  isLocationLoading: boolean;
  locationError: string | null;
  isWithinServiceArea: boolean;
  serviceMessage: string;
  requestLocation: () => void;
  clearLocationError: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined,
);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
}) => {
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);
  const [location, setLocation] = useState<LocationCoords | null>(null);

  const {
    coords: currentLocation,
    isLoading: isLocationLoading,
    error: locationError,
    getCurrentPosition,
    clearError,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 30000, // Consistent with other hooks
    maximumAge: 60000, // Allow some caching
  });

  const { isWithinServiceArea, checkServiceAvailability, getServiceMessage } =
    useServiceArea();

  useEffect(() => {
    if (!hasRequestedLocation) {
      setHasRequestedLocation(true);
      getCurrentPosition();
    }
  }, [hasRequestedLocation, getCurrentPosition]);

  useEffect(() => {
    if (
      currentLocation &&
      (!location ||
        location.lat !== currentLocation.lat ||
        location.lng !== currentLocation.lng)
    ) {
      setLocation(currentLocation);
    }
  }, [currentLocation, location]);

  useEffect(() => {
    if (location) {
      checkServiceAvailability(location);
    }
  }, [location, checkServiceAvailability]);

  const requestLocation = useCallback(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  const clearLocationError = useCallback(() => {
    clearError();
  }, [clearError]);

  const serviceMessage = getServiceMessage();

  const value: LocationContextType = {
    currentLocation: location,
    isLocationLoading,
    locationError,
    isWithinServiceArea,
    serviceMessage,
    requestLocation,
    clearLocationError,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error(
      "useLocationContext must be used within a LocationProvider",
    );
  }
  return context;
};
