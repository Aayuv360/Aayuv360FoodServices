import React from "react";
import { MapPin, Pencil } from "lucide-react";

interface AddressProps {
  selectedAddress: any;
  onEdit?: () => void;
}

export const Address: React.FC<AddressProps> = ({
  selectedAddress,
  onEdit,
}) => {
  return (
    <div key={selectedAddress.id} className="p-2 sm:p-3">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2 sm:gap-3">
          <MapPin className="w-5 h-5 mt-0.5 text-primary" />
          <div className="flex flex-col">
            <span className="font-medium text-xs sm:text-sm">
              Delivering to {selectedAddress.name}
            </span>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-2">
              {selectedAddress.addressLine1}, {selectedAddress.addressLine2},{" "}
              {selectedAddress.city}, {selectedAddress.state} -{" "}
              {selectedAddress.pincode}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Phone: {selectedAddress.phone}
            </p>
          </div>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-1 rounded hover:bg-primary/10 transition"
            aria-label="Edit address"
          >
            <Pencil className="w-4 h-4 text-primary" />
          </button>
        )}
      </div>
    </div>
  );
};
