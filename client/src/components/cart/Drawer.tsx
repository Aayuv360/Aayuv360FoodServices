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
  footer?: ReactNode;
}

export const Drawer = ({
  open,
  onClose,
  children,
  className = "",
  width = "w-full sm:max-w-md",
  title,
  footer,
}: DrawerProps) => {
  return (
    <Dialog as="div" className="relative z-50" open={open} onClose={onClose}>
      <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="fixed inset-0 overflow-hidden flex justify-end">
        <DialogPanel
          className={cn(
            "h-full bg-white shadow-xl flex flex-col",
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

          <div className="flex-1 overflow-y-auto">{children}</div>

          {footer && (
            <div className="sticky bottom-0 z-50 bg-white/95 backdrop-blur-md border-t p-4 rounded-t-xl shadow-[0_-4px_12px_rgba(0,0,0,0.25)]">
              {footer}
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
};
