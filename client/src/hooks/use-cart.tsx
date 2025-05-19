import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { Meal } from "@shared/schema";

interface CurryOption {
  id: string;
  name: string;
  priceAdjustment: number;
}

interface CartItem {
  id: number;
  userId: number;
  mealId: number;
  quantity: number;
  notes?: string | null;
  category?: string | null;
  curryOptionId?: string;
  curryOptionName?: string;
  curryOptionPrice?: number;
  meal?: Meal & {
    curryOption?: CurryOption;
    selectedCurry: CurryOption;
  };
}

type LastCurryOptionMap = Record<number, CurryOption>;

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  getLastCurryOption: (mealId: number) => CurryOption | undefined;
  isItemInCart: (mealId: number) => boolean;
  getCartItemsForMeal: (mealId: number) => CartItem[];
  getCartCategories: () => string[];
  addToCart: (meal: Meal, quantity?: number) => Promise<CartItem | undefined>;
  updateCartItem: (id: number, quantity: number) => Promise<void>;
  updateCartItemWithOptions: (
    id: number,
    curryOption: CurryOption,
  ) => Promise<void>;
  updateCartItemNotes: (id: number, notes: string | null) => Promise<void>;
  removeCartItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  clearCartByCategory: (category: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCurryOptions, setLastCurryOptions] = useState<LastCurryOptionMap>(
    {},
  );
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

  // Helper methods for cart functionality
  const getLastCurryOption = (mealId: number): CurryOption | undefined => {
    return lastCurryOptions[mealId];
  };

  const isItemInCart = (mealId: number): boolean => {
    return cartItems.some((item) => item.mealId === mealId);
  };

  const getCartItemsForMeal = (mealId: number): CartItem[] => {
    return cartItems.filter((item) => item.mealId === mealId);
  };

  const getCartCategories = (): string[] => {
    // Extract unique categories from cart items
    const categories = cartItems
      .map((item) => item.category)
      .filter(
        (category): category is string =>
          category !== undefined && category !== null,
      );

    // Return unique categories (compatible with older TS targets)
    return Array.from(new Set(categories));
  };

  // Add item to cart
  const addToCart = async (meal: Meal, quantity: number = 1) => {
    if (!user) {
      // Instead of just showing a toast, throw an error with a specific message
      // This will allow components to handle authentication needs more specifically
      throw new Error("authentication_required");
    }

    try {
      setLoading(true);

      // Check if meal has a selected curry (from the CurryOptionsModal)
      const hasSelectedCurry = (meal as any).curryOption !== undefined;

      // Prepare the payload
      const payload = {
        mealId: meal.id,
        quantity,
        // Include the complete curryOptions array from the meal
        curryOptions: meal.curryOptions || [],
        // If meal has selected curry, include it in the request with the new key
        ...(hasSelectedCurry && {
          selectedCurry: (meal as any).curryOption,
        }),
      };

      // For meals with the same ID but different curry options, we need to check
      // if the same exact meal (ID + curry option) already exists
      const existingItem = cartItems.find((item) => {
        // Basic check for meal ID
        if (item.mealId !== meal.id) return false;

        // If this meal has a curry option, we need to match that too
        if (hasSelectedCurry) {
          const itemCurryId = item.meal && (item.meal as any).curryOption?.id;
          const mealCurryId = (meal as any).curryOption?.id;
          return itemCurryId === mealCurryId;
        }

        // If no curry option, just match by meal ID
        return true;
      });

      let newCartItem: CartItem;

      if (existingItem) {
        // If the exact same item exists, update the quantity - either:
        // - Use the specified quantity directly (for customization updates)
        // - Or increment the existing quantity by 1 (for standard add operations)
        const updatedQuantity =
          quantity === 1 ? existingItem.quantity + 1 : quantity;
        const res = await apiRequest("PUT", `/api/cart/${existingItem.id}`, {
          quantity: updatedQuantity,
        });
        newCartItem = await res.json();

        // Update the cart items array with the updated item
        setCartItems(
          cartItems.map((item) =>
            item.id === existingItem.id ? newCartItem : item,
          ),
        );
      } else {
        // Otherwise, add a new item
        const res = await apiRequest("POST", "/api/cart", payload);
        newCartItem = await res.json();

        // Add the new item to the cart items array
        setCartItems([...cartItems, newCartItem]);
      }

      // Store the last curry option used for this meal
      if (hasSelectedCurry && (meal as any).curryOption) {
        setLastCurryOptions((prev) => ({
          ...prev,
          [meal.id]: (meal as any).curryOption,
        }));
      }

      return newCartItem; // Return the cart item for reference
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
      throw error; // Re-throw for error handling in the calling function
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

  const updateCartItemWithOptions = async (
    id: number,
    curryOption: CurryOption,
  ) => {
    if (!user) return;

    try {
      setLoading(true);

      // Prepare the payload with the curry option details
      const payload = {
        curryOptionId: curryOption.id,
        curryOptionName: curryOption.name,
        curryOptionPrice: curryOption.priceAdjustment,
      };

      // Call the new PATCH endpoint
      const res = await apiRequest("PATCH", `/api/cart/${id}`, payload);
      const updatedItem = await res.json();

      // Update the cart items with the updated item
      setCartItems(
        cartItems.map((item) => (item.id === id ? updatedItem : item)),
      );

      // Update the last curry option used for this meal
      if (updatedItem.mealId) {
        setLastCurryOptions((prev) => ({
          ...prev,
          [updatedItem.mealId]: curryOption,
        }));
      }
    } catch (error) {
      console.error("Error updating cart item options:", error);
      toast({
        title: "Error",
        description: "Failed to update meal customization",
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

  const updateCartItemNotes = async (id: number, notes: string | null) => {
    if (!user) return;

    try {
      setLoading(true);

      // Call the PATCH endpoint with notes update
      const res = await apiRequest("PATCH", `/api/cart/${id}`, { notes });
      const updatedItem = await res.json();

      // Update the cart items with the updated item
      setCartItems(
        cartItems.map((item) => (item.id === id ? updatedItem : item)),
      );

      toast({
        title: "Notes updated",
        description: notes
          ? "Item notes have been updated"
          : "Notes have been removed",
      });
    } catch (error) {
      console.error("Error updating cart item notes:", error);
      toast({
        title: "Error",
        description: "Failed to update item notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) return;

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

  const clearCartByCategory = async (category: string) => {
    if (!user) return;

    try {
      setLoading(true);

      // Call the new endpoint for clearing by category
      const res = await apiRequest("DELETE", `/api/cart/category/${category}`);
      const result = await res.json();

      if (result.removedCount > 0) {
        // Remove all items with the matching category
        setCartItems(cartItems.filter((item) => item.category !== category));

        toast({
          title: "Category removed",
          description: `Removed ${result.removedCount} items from the ${category} category`,
        });
      }
    } catch (error) {
      console.error("Error clearing cart category:", error);
      toast({
        title: "Error",
        description: "Failed to clear items by category",
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
        getLastCurryOption,
        isItemInCart,
        getCartItemsForMeal,
        getCartCategories,
        addToCart,
        updateCartItem,
        updateCartItemWithOptions,
        updateCartItemNotes,
        removeCartItem,
        clearCart,
        clearCartByCategory,
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
