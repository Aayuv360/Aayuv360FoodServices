import React from "react";
import { MapPin, Pencil } from "lucide-react";
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
    <div key={selectedAddress?.id} className="p-2 sm:p-3">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2 sm:gap-3">
          <MapPin className="text-orange-600 mt-0.5" size={30} />
          <div className="flex flex-col">
            <span className="font-semibold   text-base sm:text-sm">
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
            className="p-0 h-5 sm:h-6 text-[10px] sm:text-xs text-primary"
          >
            Change{" "}
          </Button>
        )}
      </div>
    </div>
  );
};
