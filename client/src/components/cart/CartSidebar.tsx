import { useState } from "react";
import { useLocation } from "wouter";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

const CartSidebar = ({ open, onClose }: CartSidebarProps) => {
  const [loading, setLoading] = useState(false);
  const [_, navigate] = useLocation();
  const { cartItems, updateCartItem, removeCartItem, clearCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.meal?.price || 0) * item.quantity,
    0
  );
  const deliveryFee = 4000; // ₹40
  const tax = 2000; // ₹20
  const total = subtotal + deliveryFee + tax;

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return `₹${(price / 100).toFixed(2)}`;
  };

  const handleQuantityChange = async (id: number, quantity: number) => {
    if (quantity < 1) return;
    updateCartItem(id, quantity);
  };

  const handleRemoveItem = (id: number) => {
    removeCartItem(id);
  };

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to checkout",
        variant: "destructive",
      });
      onClose();
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty. Add some items first.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to checkout with type 'cart' and pass the amount
    navigate(`/checkout/${encodeURIComponent("cart")}?amount=${total}&planId=cart`);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-xl z-50 transform transition duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Your Cart</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-grow overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto text-gray-300 mb-4">
                  <ShoppingCart />
                </div>
                <p className="text-gray-500 mb-4">Your cart is empty</p>
                <Button
                  onClick={() => {
                    navigate("/menu");
                    onClose();
                  }}
                >
                  Browse Menu
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 bg-neutral-light p-3 rounded-lg"
                  >
                    <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={item.meal?.imageUrl || '/placeholder-meal.jpg'}
                        alt={item.meal?.name || 'Meal item'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium text-sm">{item.meal?.name}</h4>
                      <p className="text-primary text-sm font-semibold">
                        {formatPrice(item.meal?.price || 0)}
                      </p>
                    </div>
                    <div className="flex items-center border rounded">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="px-2 py-1">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-destructive"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with Summary */}
          <div className="p-4 border-t">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Delivery Fee</span>
              <span className="font-semibold">{formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-gray-600">Tax</span>
              <span className="font-semibold">{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between mb-6 text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || loading}
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

// Fallback component for cart icon
const ShoppingCart = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className="w-full h-full"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

export default CartSidebar;
