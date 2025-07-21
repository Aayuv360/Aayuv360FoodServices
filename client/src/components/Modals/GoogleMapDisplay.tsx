import React from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";

import { ENHANCED_MAP_OPTIONS } from "@/lib/location-constants";

export const GoogleMapDisplay = ({
  currentMapLocation,
  setCurrentMapLocation,
  reverseGeocode,
  checkServiceAvailability,
  mapHeightClass = "h-[350px]",
}: {
  currentMapLocation: { lat: number; lng: number };
  setCurrentMapLocation: (loc: { lat: number; lng: number }) => void;
  reverseGeocode: (loc: { lat: number; lng: number }) => void;
  checkServiceAvailability: (loc: { lat: number; lng: number }) => void;
  mapHeightClass?: string;
}) => (
  <div className={`w-full rounded-lg overflow-hidden border ${mapHeightClass}`}>
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={currentMapLocation}
      zoom={18}
      options={ENHANCED_MAP_OPTIONS}
      onClick={(e) => {
        if (e.latLng) {
          const newLoc = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          };
          setCurrentMapLocation(newLoc);
          reverseGeocode(newLoc);
          checkServiceAvailability(newLoc);
        }
      }}
    >
      <Marker
        position={currentMapLocation}
        draggable
        animation={google.maps.Animation.DROP}
        title="Drag to adjust your exact location"
        onDragEnd={(e) => {
          const latLng = e.latLng;
          if (!latLng) return;
          const newLoc = {
            lat: latLng.lat(),
            lng: latLng.lng(),
          };
          setCurrentMapLocation(newLoc);
          reverseGeocode(newLoc);
          checkServiceAvailability(newLoc);
        }}
      />
    </GoogleMap>
  </div>
);
