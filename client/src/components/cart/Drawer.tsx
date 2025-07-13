import { AnimatePresence, motion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";
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
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                  "fixed top-0 right-0 z-50 h-full bg-white shadow-xl overflow-y-auto",
                  width,
                  className,
                )}
              >
                <div className="sticky top-0 z-50 bg-white border-b p-4 flex justify-between items-center">
                  <div className="font-bold text-xl text-orange-600 animate-fade-in">
                    {title}
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-600 hover:text-black"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};
