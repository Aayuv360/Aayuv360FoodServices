export const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  "AIzaSyAnwH0jPc54BR-sdRBybXkwIo5QjjGceSI";

export const GOOGLE_MAPS_LIBRARIES: "places"[] = ["places"];

export const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 30000, // Increased for better accuracy
  maximumAge: 60000, // Allow 1 minute cache
};

export const DEFAULT_MAP_CENTER = {
  lat: 17.385044,
  lng: 78.486671,
};

export const DEFAULT_ZOOM = 19; // Higher zoom for better accuracy

export const ENHANCED_MAP_OPTIONS = {
  clickableIcons: true, // Enable clicking on landmarks for better reference
  gestureHandling: "greedy" as const,
  mapTypeControl: true, // Allow switching to satellite view
  streetViewControl: false,
  fullscreenControl: true,
  zoomControl: true,
  mapTypeId: "roadmap" as const,
  minZoom: 12, // Prevent zooming out too much
  maxZoom: 20, // Allow high zoom for precision
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "on" }],
    },
    {
      featureType: "poi.business",
      elementType: "labels",
      stylers: [{ visibility: "on" }],
    },
    {
      featureType: "road",
      elementType: "labels",
      stylers: [{ visibility: "on" }],
    },
  ],
};

export const MAP_OPTIONS = {
  clickableIcons: false,
  gestureHandling: "greedy" as const,
  mapTypeControl: false,
  streetViewControl: false,
};

export const ADDRESS_TYPES = ["Home", "Office", "Hotel", "Others"] as const;

export const GEOCODING_COMPONENT_TYPES = [
  "subpremise",
  "premise",
  "street_number",
  "route",
  "neighborhood",
  "sublocality",
  "sublocality_level_1",
] as const;
