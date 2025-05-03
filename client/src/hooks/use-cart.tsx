import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { Meal } from "@shared/schema";

// Define the CartItem type
interface CartItem {
  id: number;
  userId: number;
  mealId: number;
  quantity: number;
  meal?: Meal;
}

// Define the cart context type
interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (meal: Meal, quantity?: number) => Promise<void>;
  updateCartItem: (id: number, quantity: number) => Promise<void>;
  removeCartItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

// Create the cart context
const CartContext = createContext<CartContextType | undefined>(undefined);

// CartProvider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch cart items when user changes
  useEffect(() => {
    const fetchCartItems = async () => {
      if (user) {
        try {
          setLoading(true);
          const res = await apiRequest("GET", "/api/cart");
          const data = await res.json();
          setCartItems(data);
        } catch (error) {
          console.error("Error fetching cart:", error);
          setCartItems([]);
        } finally {
          setLoading(false);
        }
      } else {
        // Clear cart when user logs out
        setCartItems([]);
      }
    };

    fetchCartItems();
  }, [user]);

  // Add item to cart
  const addToCart = async (meal: Meal, quantity: number = 1) => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to your cart",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await apiRequest("POST", "/api/cart", {
        mealId: meal.id,
        quantity,
      });
      const newCartItem = await res.json();
      
      // Update local cart state
      // Check if item already exists in cart
      const existingItemIndex = cartItems.findIndex(
        (item) => item.mealId === meal.id
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...cartItems];
        updatedItems[existingItemIndex] = newCartItem;
        setCartItems(updatedItems);
      } else {
        // Add new item
        setCartItems([...cartItems, newCartItem]);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (id: number, quantity: number) => {
    if (!user) return;

    try {
      setLoading(true);
      const res = await apiRequest("PUT", `/api/cart/${id}`, { quantity });
      const updatedItem = await res.json();
      
      // Update local cart state
      setCartItems(
        cartItems.map((item) => (item.id === id ? updatedItem : item))
      );
    } catch (error) {
      console.error("Error updating cart item:", error);
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeCartItem = async (id: number) => {
    if (!user) return;

    try {
      setLoading(true);
      await apiRequest("DELETE", `/api/cart/${id}`);
      
      // Update local cart state
      setCartItems(cartItems.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error removing cart item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await apiRequest("DELETE", "/api/cart");
      
      // Update local cart state
      setCartItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook to use the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
