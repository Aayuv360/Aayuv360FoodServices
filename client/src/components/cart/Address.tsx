import React from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddressProps {
  selectedAddress: any;
  onEdit?: () => void;
}

export const Address: React.FC<AddressProps> = ({
  selectedAddress,
  onEdit,
}) => {
  return (
    <div key={selectedAddress?.id} className="pb-2">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2 sm:gap-3">
          <MapPin className="text-orange-600 mt-0.5 w-5 h-5 sm:w-6 sm:h-6" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm sm:text-base">
              Delivering to {selectedAddress?.label}
            </span>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
              {selectedAddress?.address}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Phone: {selectedAddress?.phone}
            </p>
          </div>
        </div>
        {onEdit && (
          <Button
            variant="link"
            onClick={onEdit}
            size="sm"
            className="p-0 h-5 sm:h-6 text-xs sm:text-sm font-semibold text-primary"
          >
            Change
          </Button>
        )}
      </div>
    </div>
  );
};
