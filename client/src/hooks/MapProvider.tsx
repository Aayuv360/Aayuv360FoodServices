import React, { useEffect } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { useSetRecoilState } from "recoil";
import { mapLoadState } from "../Recoil/recoil";

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAnwH0jPc54BR-sdRBybXkwIo5QjjGceSI",
    libraries: ["places"],
  });

  const setMapLoaded = useSetRecoilState(mapLoadState);

  useEffect(() => {
    setMapLoaded(isLoaded);
  }, [isLoaded, setMapLoaded]);

  return <>{children}</>;
};
