import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import CartSidebar from "@/components/cart/CartSidebar";
import { useUIContext } from "@/contexts/UIContext";

const MobileBottomNav = () => {
  const { cartItems } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const { isAddressModalOpen } = useUIContext();

  const handleCartClick = () => {
    setCartOpen(true);
  };

  return (
    <>
      {cartItems.length && (
        <div
          className="fixed bottom-2 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-50 md:hidden sticky rounded-xl m-2"
          onClick={handleCartClick}
        >
          <div className="flex items-center justify-between px-4 py-3 safe-area-inset-bottom">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {cartItems.length} item{cartItems.length > 1 ? "s" : ""} in
                  cart
                </span>
                <span className="text-xs text-gray-500">Tap to continue</span>
              </div>
            </div>

            <button
              onClick={handleCartClick}
              className="bg-primary text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg active:scale-95"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
        </div>
      )}
    </>
  );
};

export default MobileBottomNav;
