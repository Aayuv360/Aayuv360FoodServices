import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface AddressFormProps {
  editingAddress: any;
  user: any;
  addressType: string;
  setAddressType: (type: string) => void;
  addressDetails: { landmark: string };
  setAddressDetails: React.Dispatch<React.SetStateAction<{ landmark: string }>>;
  isWithinServiceArea: boolean;
  isUpdateAddress: boolean;
  addressModalAction: string;
  onSubmit: (addressData: any) => void;
}

export const AddressForm = ({
  editingAddress,
  user,
  addressType,
  setAddressType,
  addressDetails,
  setAddressDetails,
  isWithinServiceArea,
  isUpdateAddress,
  addressModalAction,
  onSubmit,
}: AddressFormProps) => {
  return (
    <div className="text-sm sm:text-base">
      {" "}
      {/* Responsive wrapper */}
      <form
        id="address-form"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const addressData = {
            name: formData.get("addressName") as string,
            phone: formData.get("phone") as string,
            addressLine1: formData.get("addressLine1") as string,
            addressLine2: (formData.get("addressLine2") as string) || undefined,
            isDefault: Boolean(formData.get("isDefault")),
            userName: formData.get("userName") as string,
            nearbyLandmark: formData.get("nearbyLandmark") as string,
          };

          onSubmit(addressData);
        }}
        className="space-y-4"
      >
        <div className="flex gap-2">
          {["Home", "Office", "Hotel", "Others"].map((label) => (
            <Button
              key={label}
              type="button"
              className={`w-full sm:w-auto text-sm sm:text-base rounded-2xl ${
                addressType !== label &&
                "bg-white hover:text-gray-700 hover:bg-orange-100"
              }`}
              variant={addressType === label ? "default" : "outline"}
              onClick={() => setAddressType(label)}
            >
              {label}
            </Button>
          ))}
          <input type="hidden" name="addressName" value={addressType} />
        </div>

        <div>
          <Label className="text-sm sm:text-base">
            Flat No. / House / Building name
          </Label>
          <Input
            className="w-full text-sm sm:text-base"
            name="addressLine1"
            placeholder="Flat No./House/Building name"
            defaultValue={editingAddress?.addressLine1 || ""}
            required
          />
        </div>

        <div>
          <Label className="text-sm sm:text-base">Area / Locality</Label>
          <Input
            className="w-full text-sm sm:text-base"
            name="addressLine2"
            placeholder="Landmark, Area, Locality, etc."
            value={addressDetails.landmark}
            onChange={(e) =>
              setAddressDetails((prev) => ({
                ...prev,
                landmark: e.target.value,
              }))
            }
            readOnly
          />
        </div>

        <div>
          <Label className="text-sm sm:text-base">Near by landmark</Label>
          <Input
            className="w-full text-sm sm:text-base"
            name="nearbyLandmark"
            placeholder="Near by landmark"
            defaultValue={editingAddress?.nearbyLandmark || ""}
          />
        </div>

        <div className="text-primary text-sm sm:text-base">
          Provide your information for delivery
        </div>

        <div className="!mt-1">
          <Label className="text-sm sm:text-base">Name</Label>
          <Input
            className="w-full text-sm sm:text-base"
            name="userName"
            placeholder="Your name"
            defaultValue={editingAddress?.userName || user?.username || ""}
            required
          />
        </div>

        <div>
          <Label className="text-sm sm:text-base">Phone Number</Label>
          <Input
            className="w-full text-sm sm:text-base"
            name="phone"
            placeholder="10-digit mobile number"
            maxLength={10}
            defaultValue={editingAddress?.phone || ""}
            required
            inputMode="numeric"
            pattern="\d*"
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
            }}
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={editingAddress?.isDefault || false}
            id="isDefault"
            className="accent-primary w-4 h-4"
          />
          <Label htmlFor="isDefault" className="text-sm sm:text-base">
            Set as default address
          </Label>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={!isWithinServiceArea || isUpdateAddress}
            className="text-sm sm:text-base"
          >
            {isUpdateAddress ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {addressModalAction === "addressEdit"
                  ? "Updating..."
                  : "Saving..."}
              </div>
            ) : addressModalAction === "addressEdit" ? (
              "Update Address"
            ) : (
              "Save Address"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
