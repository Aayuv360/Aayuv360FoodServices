import React from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";

interface MapProps {
  currentMapLocation: { lat: number; lng: number };
  setCurrentMapLocation: (loc: { lat: number; lng: number }) => void;
  onLocationChange: (loc: { lat: number; lng: number }) => void;
}

export const GoogleMaps: React.FC<MapProps> = ({
  currentMapLocation,
  setCurrentMapLocation,
  onLocationChange,
}) => {
  return <></>;
};
