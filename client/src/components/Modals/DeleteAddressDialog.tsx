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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Address</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this address? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        {address && (
          <div className="py-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{address.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {address.addressLine1}
              </p>
              {address.addressLine2 && (
                <p className="text-sm text-gray-600">{address.addressLine2}</p>
              )}
              <p className="text-sm text-gray-600 mt-1">{address.phone}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (address) onConfirm(address.id);
            }}
          >
            Delete Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAddressDialog;
