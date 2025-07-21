import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type DeleteAddressDialogProps = {
  open: boolean;
  address: any;
  onCancel: () => void;
  onConfirm: (id: number) => void;
};

const DeleteAddressDialog: React.FC<DeleteAddressDialogProps> = ({
  open,
  address,
  onCancel,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px] text-sm sm:text-base">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Delete Address
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Are you sure you want to delete this address? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        {address && (
          <div className="py-3 sm:py-4">
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-sm sm:text-base">{address.name}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {address.addressLine1}
              </p>
              {address.addressLine2 && (
                <p className="text-xs sm:text-sm text-gray-600">
                  {address.addressLine2}
                </p>
              )}
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {address.phone}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-4 space-y-2 sm:space-y-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto text-sm sm:text-base"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (address) onConfirm(address.id);
            }}
            className="w-full sm:w-auto text-sm sm:text-base"
          >
            Delete Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAddressDialog;
