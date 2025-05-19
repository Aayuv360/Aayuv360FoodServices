import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

interface Address {
  id: number;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface DeliveryAddressStepProps {
  addresses: Address[];
  selectedAddressId: number | null;
  setSelectedAddressId: (id: number | null) => void;
  setAddressModalOpen: (open: boolean) => void;
}

const DeliveryAddressStep: React.FC<DeliveryAddressStepProps> = ({
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  setAddressModalOpen,
}) => {
  return (
    <div className="flex-grow overflow-y-auto p-4 sm:p-6">
      <h3 className="font-medium mb-4">Delivery Address</h3>

      {addresses.length > 0 ? (
        <div className="space-y-4">
          <RadioGroup
            value={selectedAddressId?.toString()}
            onValueChange={(value) => setSelectedAddressId(parseInt(value))}
          >
            {addresses.map((address) => (
              <div
                key={address.id}
                className="flex items-start space-x-2 border rounded-md p-3 hover:border-primary transition-colors"
              >
                <RadioGroupItem
                  value={address.id.toString()}
                  id={`address-${address.id}`}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`address-${address.id}`}
                    className="font-medium cursor-pointer"
                  >
                    {address.name}
                    {address.isDefault && (
                      <Badge className="ml-2 bg-primary/10 text-primary text-[10px] py-0">
                        Default
                      </Badge>
                    )}
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {address.addressLine1}
                    {address.addressLine2 && `, ${address.addressLine2}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {address.city}, {address.state} - {address.pincode}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Phone: {address.phone}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>

          <Button
            onClick={() => setAddressModalOpen(true)}
            variant="outline"
            className="w-full"
          >
            Add New Address
          </Button>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-4 text-sm">
            You don't have any saved addresses yet
          </p>
          <Button onClick={() => setAddressModalOpen(true)}>
            Add New Address
          </Button>
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-medium mb-3">Delivery Type</h3>
        <div className="space-y-3">
          <RadioGroup defaultValue="default">
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="default" id="delivery-default" />
              <div className="flex-1">
                <Label
                  htmlFor="delivery-default"
                  className="font-medium cursor-pointer"
                >
                  Regular Delivery
                </Label>
                <p className="text-xs text-gray-600">
                  Delivery within 60-90 minutes - ₹40
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="express" id="delivery-express" />
              <div className="flex-1">
                <Label
                  htmlFor="delivery-express"
                  className="font-medium cursor-pointer"
                >
                  Express Delivery
                </Label>
                <p className="text-xs text-gray-600">
                  Priority delivery within 30-45 minutes - ₹60
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAddressStep;