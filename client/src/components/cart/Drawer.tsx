import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  width?: string;
  title?: ReactNode;
}

export const Drawer = ({
  open,
  onClose,
  children,
  className = "",
  width = "w-full sm:max-w-md",
  title,
}: DrawerProps) => {
  return (
    <Dialog as="div" className="relative z-50" open={open} onClose={onClose}>
      <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="fixed inset-0 overflow-hidden flex justify-end">
        <DialogPanel
          className={cn(
            "h-full bg-white shadow-xl overflow-y-auto",
            width,
            className,
          )}
        >
          <div className="sticky top-0 z-50 bg-white border-b p-4 flex justify-between items-center">
            {title && (
              <DialogTitle
                as="h2"
                className="font-bold text-xl text-orange-600"
              >
                {title}
              </DialogTitle>
            )}
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-black"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>{children}</div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
