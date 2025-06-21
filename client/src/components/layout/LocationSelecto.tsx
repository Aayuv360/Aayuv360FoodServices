// components/LocationSelector.tsx

import React, { useState, useEffect } from "react";
import { useLoadScript } from "@react-google-maps/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, Loader2 } from "lucide-react";
import { useRecoilValue } from "recoil";
import { mapLoadState } from "@/Recoil/recoil";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useServiceArea } from "@/hooks/use-service-area";

const libraries: "places"[] = [];

const LocationSelector = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAnwH0jPc54BR-sdRBybXkwIo5QjjGceSI",
    libraries,
  });

  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [locationFetched, setLocationFetched] = useState(false);

  const { isLoading: geoLoading, getCurrentPosition } = useGeolocation();
  const { checkServiceAvailability, isWithinServiceArea, getServiceMessage } =
    useServiceArea();

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSuggestions(input);
    }, 500);

    return () => clearTimeout(timeout);
  }, [input]);

  const fetchSuggestions = (input: string) => {
    if (!window.google || !input) return;

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: "in" },
      },
      (predictions, status) => {
        if (status === "OK" && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      },
    );
  };

  const handleSelectSuggestion = (placeId: string) => {
    if (!window.google || !placeId) return;

    const service = new window.google.maps.places.PlacesService(
      document.createElement("div"),
    );
    service.getDetails(
      {
        placeId,
        fields: ["geometry", "formatted_address"],
      },
      (place, status) => {
        if (status === "OK" && place && place.geometry?.location) {
          const location = place.geometry.location;
          const coords = {
            lat: location.lat(),
            lng: location.lng(),
          };

          setSelectedAddress(place.formatted_address ?? "Unknown address");
          setSuggestions([]);
          setInput("");
          //checkServiceAvailability(coords);
        }
      },
    );
  };

  const handleUseCurrentLocation = () => {
    setSuggestions([]);
    setInput("");
    getCurrentPosition();
  };
  console.log()

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition flex items-center pt-[8px] pl-[10px] sm:pl-[20px]">
            <MapPin className={`h-5 w-5 hover:text-primary`} />
            <div className="whitespace-normal break-words">
              {selectedAddress ? selectedAddress : "Select Location"}
            </div>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80 p-2">
          <div className="mb-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search location..."
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          {input !== "" &&
            suggestions.map((suggestion, idx) => (
              <DropdownMenuItem
                key={idx}
                onClick={() => handleSelectSuggestion(suggestion.place_id)}
                className="cursor-pointer text-sm"
              >
                {suggestion.description}
              </DropdownMenuItem>
            ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer mt-1"
            onClick={handleUseCurrentLocation}
            disabled={geoLoading}
          >
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Use My Current Location
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LocationSelector;
