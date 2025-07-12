import { useState, useEffect, useCallback } from 'react';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface GeolocationState {
  coords: LocationCoords | null;
  isLoading: boolean;
  error: string | null;
  accuracy: number | null;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    isLoading: false,
    error: null,
    accuracy: null,
  });

  const defaultOptions: GeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 60000, // Cache for 1 minute to improve performance
    ...options,
  };

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
        isLoading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          isLoading: false,
          error: null,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      },
      defaultOptions
    );
  }, [defaultOptions.enableHighAccuracy, defaultOptions.timeout, defaultOptions.maximumAge]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    getCurrentPosition,
    clearError,
    isSupported: !!navigator.geolocation,
  };
};