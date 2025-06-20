import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";

const MobileBottomNav = () => {
  const { cartItems } = useCart();
  const [, navigate] = useLocation();

  const handleCartClick = () => {
    navigate("/checkout");
  };

  if (cartItems.length === 0) {
    return null; // Don't show footer if cart is empty
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className="w-6 h-6 text-primary" />
            <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
              {cartItems.length}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {cartItems.length} item{cartItems.length > 1 ? 's' : ''} in cart
            </span>
            <span className="text-xs text-gray-500">
              Tap to continue
            </span>
          </div>
        </div>
        
        <button
          onClick={handleCartClick}
          className="bg-primary text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-md"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;