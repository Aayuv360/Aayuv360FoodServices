import React, {
  createContext,
  useContext,
  useEffect,
  useState,
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

  const {
    coords: currentLocation,
    isLoading: isLocationLoading,
    error: locationError,
    getCurrentPosition,
    clearError,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes
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
    if (currentLocation) {
      checkServiceAvailability(currentLocation);
    }
  }, [currentLocation, checkServiceAvailability]);

  const requestLocation = () => {
    getCurrentPosition();
  };

  const clearLocationError = () => {
    clearError();
  };

  const serviceMessage = getServiceMessage();

  const value: LocationContextType = {
    currentLocation,
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
