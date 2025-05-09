import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { Meal } from "@shared/schema";

interface CartItem {
  id: number;
  userId: number;
  mealId: number;
  quantity: number;
  meal?: Meal;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (meal: Meal, quantity?: number) => Promise<void>;
  updateCartItem: (id: number, quantity: number) => Promise<void>;
  removeCartItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCartItems = async () => {
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
      
      // Check if meal has curry option (from the CurryOptionsModal)
      const hasCurryOption = (meal as any).curryOption !== undefined;
      
      const payload = {
        mealId: meal.id,
        quantity,
        // If meal has curry option, include it in the request
        ...(hasCurryOption && { 
          curryOption: (meal as any).curryOption 
        })
      };
      
      const res = await apiRequest("POST", "/api/cart", payload);
      const newCartItem = await res.json();

      // For meals with the same ID but different curry options, we need to check
      // if the same exact meal (ID + curry option) already exists
      const existingItemIndex = cartItems.findIndex(item => {
        // Basic check for meal ID
        if (item.mealId !== meal.id) return false;
        
        // If this meal has a curry option, we need to match that too
        if (hasCurryOption) {
          const itemCurryId = item.meal && (item.meal as any).curryOption?.id;
          const mealCurryId = (meal as any).curryOption?.id;
          return itemCurryId === mealCurryId;
        }
        
        // If no curry option, just match by meal ID
        return true;
      });

      if (existingItemIndex >= 0) {
        const updatedItems = [...cartItems];
        updatedItems[existingItemIndex] = newCartItem;
        setCartItems(updatedItems);
      } else {
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

  const updateCartItem = async (id: number, quantity: number) => {
    if (!user) return;

    try {
      setLoading(true);
      const res = await apiRequest("PUT", `/api/cart/${id}`, { quantity });
      const updatedItem = await res.json();

      setCartItems(
        cartItems.map((item) => (item.id === id ? updatedItem : item)),
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

  const removeCartItem = async (id: number) => {
    if (!user) return;

    try {
      setLoading(true);
      await apiRequest("DELETE", `/api/cart/${id}`);

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

  const clearCart = async () => {
    // if (!user) return;

    try {
      setLoading(true);
      await apiRequest("DELETE", "/api/cart");

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

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
