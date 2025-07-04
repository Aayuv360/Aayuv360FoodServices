
import type { Express, Request, Response } from "express";
import { mongoStorage } from "../mongoStorage";
import { CartItem as CartItemModel, Meal as MealModel } from "../../shared/mongoModels";

export function registerCartRoutes(app: Express) {
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  app.get("/api/cart", async (req, res) => {
    try {
      const userId = req.isAuthenticated() ? (req.user as any).id : 0;
      const cartItems = await CartItemModel.find({ userId }).lean();

      const enrichedCartItems = await Promise.all(
        cartItems.map(async (item) => {
          const meal = await MealModel.findOne({ id: item.mealId }).lean();
          const fullMeal = meal
            ? await MealModel.findOne({ id: meal.id }).lean()
            : null;

          const cartItemCurryOptions = (item as any).curryOptions || [];
          let mealWithCurryOption = {
            ...meal,
            curryOptions:
              cartItemCurryOptions.length > 0
                ? cartItemCurryOptions
                : fullMeal?.curryOptions || meal?.curryOptions || [],
          };

          if (meal && item.curryOptionId && item.curryOptionName) {
            (mealWithCurryOption as any).selectedCurry = {
              id: item.curryOptionId,
              name: item.curryOptionName,
              priceAdjustment: item.curryOptionPrice || 0,
            };
          }

          return {
            ...item,
            meal: mealWithCurryOption,
          };
        })
      );

      res.json(enrichedCartItems);
    } catch (err) {
      console.error("Error fetching cart:", err);
      res.status(500).json({ message: "Error fetching cart items" });
    }
  });

  app.post("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;

      let curryOptionId = null;
      let curryOptionName = null;
      let curryOptionPrice = null;

      if (req.body.selectedCurry) {
        curryOptionId = req.body.selectedCurry.id;
        curryOptionName = req.body.selectedCurry.name;
        curryOptionPrice = req.body.selectedCurry.priceAdjustment || 0;
      }

      const mealDetails = await MealModel.findOne({
        id: req.body.mealId,
      }).lean();

      const mealCurryOptions =
        req.body.curryOptions || mealDetails?.curryOptions || [];
      const cartItemData = {
        ...req.body,
        userId,
        curryOptionId,
        curryOptionName,
        curryOptionPrice,
        curryOptions: mealCurryOptions,
      };

      const cartItem = await mongoStorage.addToCart(cartItemData);
      const mealFromStorage = await mongoStorage.getMeal(cartItem.mealId);

      let mealWithCurryOption = mealFromStorage;

      const mealWithOptions = await MealModel.findOne({
        id: mealFromStorage?.id,
      }).lean();

      mealWithCurryOption = {
        ...mealWithCurryOption,
        curryOptions: mealWithOptions?.curryOptions || mealCurryOptions || [],
      };

      if (curryOptionId && curryOptionName) {
        mealWithCurryOption = {
          ...mealWithCurryOption,
          selectedCurry: {
            id: curryOptionId,
            name: curryOptionName,
            priceAdjustment: curryOptionPrice || 0,
          },
        };
      }

      res.status(201).json({ ...cartItem, meal: mealWithCurryOption });
    } catch (err) {
      console.error("Error adding to cart:", err);
      res.status(500).json({ message: "Error adding item to cart" });
    }
  });

  app.put("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const { quantity } = req.body;

      const cartItems = await mongoStorage.getCartItems(userId);
      const existingItem = cartItems.find((item) => item.id === itemId);

      if (!existingItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      const updatedItem = await mongoStorage.updateCartItemQuantity(
        itemId,
        quantity
      );
      const meal = await mongoStorage.getMeal(updatedItem.mealId);

      let mealWithCurryOption = meal;
      if (updatedItem?.curryOptionId && updatedItem.curryOptionName) {
        mealWithCurryOption = {
          ...meal,
          curryOption: {
            id: updatedItem.curryOptionId,
            name: updatedItem.curryOptionName,
            priceAdjustment: updatedItem.curryOptionPrice || 0,
          },
        };
      }

      res.json({ ...updatedItem, meal: mealWithCurryOption });
    } catch (err) {
      console.error("Error updating cart item quantity:", err);
      res.status(500).json({ message: "Error updating cart item quantity" });
    }
  });

  app.patch("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const userId = (req.user as any).id;

      const cartItems = await mongoStorage.getCartItems(userId);
      const existingItem = cartItems.find((item) => item.id === itemId);

      if (!existingItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      const updates = req.body;
      const updatedItem = await mongoStorage.updateCartItem(itemId, updates);
      const meal = await mongoStorage.getMeal(updatedItem.mealId);

      let mealWithCurryOption = meal;
      if (updatedItem?.curryOptionId && updatedItem.curryOptionName) {
        mealWithCurryOption = {
          ...meal,
          curryOption: {
            id: updatedItem.curryOptionId,
            name: updatedItem.curryOptionName,
            priceAdjustment: updatedItem.curryOptionPrice || 0,
          },
        };
      }

      res.json({ ...updatedItem, meal: mealWithCurryOption });
    } catch (err) {
      console.error("Error updating cart item:", err);
      res.status(500).json({ message: "Error updating cart item" });
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const userId = (req.user as any).id;

      const cartItems = await mongoStorage.getCartItems(userId);
      const existingItem = cartItems.find((item: any) => item.id === itemId);

      if (!existingItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      await mongoStorage.removeFromCart(itemId);
      res.status(204).send();
    } catch (err) {
      console.error("Error removing cart item:", err);
      res.status(500).json({ message: "Error removing item from cart" });
    }
  });

  app.delete("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      await mongoStorage.clearCart(userId);
      res.status(204).send();
    } catch (err) {
      console.error("Error clearing cart:", err);
      res.status(500).json({ message: "Error clearing cart" });
    }
  });
}
