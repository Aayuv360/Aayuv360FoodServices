import React, { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { useRecoilValue } from "recoil";
import { locationDisplayTextState } from "@/Recoil/recoil";
import { LocationModal } from "@/components/location/LocationModal";

const LocationSelector = () => {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const displayText = useRecoilValue(locationDisplayTextState);

  const handleLocationClick = () => {
    setIsLocationModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleLocationClick}
        className="cursor-pointer gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition flex items-center py-2 px-2 sm:px-4 max-w-[200px] sm:max-w-[300px] rounded-md hover:bg-gray-50"
      >
        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 hover:text-primary flex-shrink-0" />
        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
          {displayText}
        </div>
        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
      </button>

      <LocationModal
        isOpen={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
        onLocationConfirmed={() => {
          // Location is automatically updated via Recoil state
        }}
      />
    </>
  );
};

export default LocationSelector;
