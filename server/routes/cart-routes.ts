
import type { Express, Request, Response } from "express";
import { mongoStorage } from "../mongoStorage";
import { CartItem as CartItemModel, Meal as MealModel } from "../../shared/mongoModels";
import { authenticateToken, optionalAuthenticateToken } from "../jwt-middleware";

export function registerCartRoutes(app: Express) {
  app.get("/api/cart", optionalAuthenticateToken, async (req, res) => {
    try {
      const userId = req.user ? req.user.id : 0;
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

  app.post("/api/cart", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;

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

  app.put("/api/cart/:id", authenticateToken, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const userId = req.user!.id;
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

  app.patch("/api/cart/:id", authenticateToken, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const userId = req.user!.id;

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

  app.delete("/api/cart/:id", authenticateToken, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const userId = req.user!.id;

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

  app.delete("/api/cart", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      await mongoStorage.clearCart(userId);
      res.status(204).send();
    } catch (err) {
      console.error("Error clearing cart:", err);
      res.status(500).json({ message: "Error clearing cart" });
    }
  });

  // Add item to cart
  app.post("/api/cart/add", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { mealId, quantity = 1, curryOptionId, curryOptionName, curryOptionPrice, notes } = req.body;

      if (!mealId) {
        return res.status(400).json({ message: "Meal ID is required" });
      }

      // Check if meal exists
      const meal = await MealModel.findOne({ id: mealId }).lean();
      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }

      // Check if item with same curry option already exists
      let existingItem = null;
      if (curryOptionId) {
        existingItem = await CartItemModel.findOne({
          userId,
          mealId,
          curryOptionId
        }).lean();
      } else {
        existingItem = await CartItemModel.findOne({
          userId,
          mealId,
          $or: [
            { curryOptionId: { $exists: false } },
            { curryOptionId: null }
          ]
        }).lean();
      }

      if (existingItem) {
        // Update existing item quantity
        const updatedItem = await CartItemModel.findByIdAndUpdate(
          existingItem._id,
          { $inc: { quantity: quantity } },
          { new: true }
        ).lean();
        
        return res.json(updatedItem);
      } else {
        // Create new cart item
        const newCartItem = new CartItemModel({
          userId,
          mealId,
          quantity,
          curryOptionId,
          curryOptionName,
          curryOptionPrice: curryOptionPrice || 0,
          notes: notes || null
        });

        const savedItem = await newCartItem.save();
        res.json(savedItem);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      res.status(500).json({ message: "Error adding item to cart" });
    }
  });

  // Update cart item
  app.put("/api/cart/:id", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const itemId = req.params.id;
      const { quantity, curryOptionId, curryOptionName, curryOptionPrice, notes } = req.body;

      const updatedItem = await CartItemModel.findOneAndUpdate(
        { _id: itemId, userId },
        {
          ...(quantity !== undefined && { quantity }),
          ...(curryOptionId !== undefined && { curryOptionId }),
          ...(curryOptionName !== undefined && { curryOptionName }),
          ...(curryOptionPrice !== undefined && { curryOptionPrice }),
          ...(notes !== undefined && { notes })
        },
        { new: true }
      ).lean();

      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      res.json(updatedItem);
    } catch (err) {
      console.error("Error updating cart item:", err);
      res.status(500).json({ message: "Error updating cart item" });
    }
  });

  // Remove cart item
  app.delete("/api/cart/:id", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      const itemId = req.params.id;

      const deletedItem = await CartItemModel.findOneAndDelete({
        _id: itemId,
        userId
      }).lean();

      if (!deletedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      res.json({ message: "Item removed from cart" });
    } catch (err) {
      console.error("Error removing cart item:", err);
      res.status(500).json({ message: "Error removing cart item" });
    }
  });

  // Clear entire cart
  app.delete("/api/cart", authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      await CartItemModel.deleteMany({ userId });
      res.json({ message: "Cart cleared" });
    } catch (err) {
      console.error("Error clearing cart:", err);
      res.status(500).json({ message: "Error clearing cart" });
    }
  });
}
