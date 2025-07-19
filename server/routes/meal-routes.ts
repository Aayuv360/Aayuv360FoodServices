import type { Express, Request, Response } from "express";
import { Meal as MealModel, CurryOption } from "../../shared/mongoModels";
import { formatCurryOptions } from "../curry-formatter";
import { upload, processImage, deleteImage } from "../upload";
import { authenticateToken, requireAdmin } from "../jwt-middleware";

export function registerMealRoutes(app: Express) {
  app.get("/api/meals", async (req, res) => {
    try {
      console.log("Fetching all meals directly from MongoDB...");
      const meals = await MealModel.find().lean();
      const globalCurryOptions = await CurryOption.find().lean();

      const enhancedMeals = meals.map((meal) => {
        let curryOptionsArray = [];

        if (meal.curryOptions && meal.curryOptions.length > 0) {
          curryOptionsArray = meal.curryOptions.map((option: any) => [
            option.id,
            option.name,
            option.priceAdjustment,
          ]);
        } else {
          const mealSpecificOptions = globalCurryOptions.filter(
            (option: any) =>
              option.mealId === null || option.mealId === meal.id,
          );
          curryOptionsArray = mealSpecificOptions.map((option: any) => [
            option.id,
            option.name,
            option.priceAdjustment,
          ]);
        }

        return {
          ...meal,
          curryOptions: curryOptionsArray,
        };
      });

      console.log(`Retrieved ${meals.length} meals from MongoDB`);
      res.json(enhancedMeals);
    } catch (err) {
      console.error("Error fetching meals:", err);
      res.status(500).json({ message: "Error fetching meals" });
    }
  });

  app.get("/api/meals/:id", async (req, res) => {
    try {
      const mealId = parseInt(req.params.id);
      const meal = await MealModel.findOne({ id: mealId }).lean();

      if (!meal) {
        return res.status(404).json({ message: "Meal not found" });
      }

      let curryOptionsArray = [];

      if (meal.curryOptions && meal.curryOptions.length > 0) {
        curryOptionsArray = meal.curryOptions.map((option: any) => [
          option.id,
          option.name,
          option.priceAdjustment,
        ]);
      } else {
        const globalCurryOptions = await CurryOption.find({
          $or: [{ mealId: null }, { mealId: mealId }],
        }).lean();

        curryOptionsArray = globalCurryOptions.map((option: any) => [
          option.id,
          option.name,
          option.priceAdjustment,
        ]);
      }

      const enhancedMeal = {
        ...meal,
        curryOptions: curryOptionsArray,
      };

      res.json(enhancedMeal);
    } catch (err) {
      console.error("Error fetching meal:", err);
      res.status(500).json({ message: "Error fetching meal" });
    }
  });

  app.get("/api/meals/type/:type", async (req, res) => {
    try {
      const mealType = req.params.type;
      const meals = await MealModel.find({ mealType }).lean();
      const globalCurryOptions = await CurryOption.find().lean();

      const enhancedMeals = meals.map((meal) => {
        let curryOptionsArray = [];

        if (meal.curryOptions && meal.curryOptions.length > 0) {
          curryOptionsArray = meal.curryOptions;
        } else {
          curryOptionsArray = globalCurryOptions.map((option) => [
            option._id.toString(),
            option.name,
            option.priceAdjustment,
          ]);
        }

        return {
          ...meal,
          curryOptions: curryOptionsArray,
        };
      });

      res.json(enhancedMeals);
    } catch (err) {
      console.error("Error fetching meals by type:", err);
      res.status(500).json({ message: "Error fetching meals by type" });
    }
  });

  // Admin meal routes
  app.get(
    "/api/admin/meals/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const meals = await MealModel.find().lean();
        const globalCurryOptions = await CurryOption.find().lean();

        const enhancedMeals = meals.map((meal) => {
          if (meal.curryOptions && meal.curryOptions.length > 0) {
            if (
              typeof meal.curryOptions[0] === "object" &&
              !Array.isArray(meal.curryOptions[0])
            ) {
              return meal;
            }

            return {
              ...meal,
              curryOptions: meal.curryOptions.map((option: any) => {
                if (Array.isArray(option)) {
                  return {
                    id: option[0],
                    name: option[1],
                    priceAdjustment: option[2],
                  };
                }
                return option;
              }),
            };
          } else {
            const mealSpecificOptions = globalCurryOptions.filter(
              (option: any) =>
                option.mealId === null || option.mealId === meal.id,
            );

            return {
              ...meal,
              curryOptions: formatCurryOptions(mealSpecificOptions, meal.id),
            };
          }
        });

        console.log(`Admin: Retrieved ${meals.length} meals from MongoDB`);
        res.json(enhancedMeals);
      } catch (err) {
        console.error("Error fetching meals:", err);
        res.status(500).json({ message: "Error fetching meals" });
      }
    },
  );

  app.post(
    "/api/admin/upload-image",
    authenticateToken,
    requireAdmin,
    upload.single("image"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No image file provided" });
        }

        const imageUrl = await processImage(
          req.file.buffer,
          req.file.originalname,
        );
        res.json({ imageUrl });
      } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ message: "Failed to upload image" });
      }
    },
  );
  app.get(
    "/api/admin/meals",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const meals = await MealModel.find().lean();

        const globalCurryOptions = await CurryOption.find().lean();

        const enhancedMeals = meals.map((meal) => {
          if (meal.curryOptions && meal.curryOptions.length > 0) {
            if (
              typeof meal.curryOptions[0] === "object" &&
              !Array.isArray(meal.curryOptions[0])
            ) {
              return meal;
            }

            return {
              ...meal,
              curryOptions: meal.curryOptions.map((option: any) => {
                if (Array.isArray(option)) {
                  return {
                    id: option[0],
                    name: option[1],
                    priceAdjustment: option[2],
                  };
                }
                return option;
              }),
            };
          } else {
            const mealSpecificOptions = globalCurryOptions.filter(
              (option: any) =>
                option.mealId === null || option.mealId === meal.id,
            );

            return {
              ...meal,
              curryOptions: formatCurryOptions(mealSpecificOptions, meal.id),
            };
          }
        });

        console.log(`Admin: Retrieved ${meals.length} meals from MongoDB`);
        res.json(enhancedMeals);
      } catch (err) {
        console.error("Error fetching meals:", err);
        res.status(500).json({ message: "Error fetching meals" });
      }
    },
  );
  app.post(
    "/api/admin/meals",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        let mealData = { ...req.body };
        console.log("Admin: Creating new meal in MongoDB...");

        if (mealData.curryOptions && Array.isArray(mealData.curryOptions)) {
          mealData.curryOptions = mealData.curryOptions.map((option: any) => {
            if (
              typeof option === "object" &&
              !Array.isArray(option) &&
              option.id
            ) {
              return [option.id, option.name, option.priceAdjustment];
            }
            return option;
          });
        }

        const newMeal = await MealModel.create(mealData);
        console.log(`Admin: Created new meal with ID ${newMeal.id}`);

        const responseData = {
          ...newMeal.toObject(),
          curryOptions: newMeal.curryOptions
            ? formatCurryOptions(newMeal.curryOptions, newMeal.id)
            : [],
        };

        res.status(201).json(responseData);
      } catch (err) {
        console.error("Error creating meal:", err);
        res.status(500).json({ message: "Error creating meal" });
      }
    },
  );

  app.put(
    "/api/admin/meals/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const mealId = parseInt(req.params.id);
        let mealData = { ...req.body };

        console.log(`Admin: Updating meal with ID ${mealId} in MongoDB...`);

        const existingMeal = await MealModel.findOne({ id: mealId }).lean();

        if (mealData.curryOptions && Array.isArray(mealData.curryOptions)) {
          mealData.curryOptions = mealData.curryOptions.map((option: any) => {
            if (
              typeof option === "object" &&
              !Array.isArray(option) &&
              option.id
            ) {
              return [option.id, option.name, option.priceAdjustment];
            }
            return option;
          });
        }

        const result = await MealModel.findOneAndUpdate(
          { id: mealId },
          { $set: mealData },
          { new: true },
        ).lean();

        if (!result) {
          console.log(`Admin: Meal with ID ${mealId} not found`);
          return res.status(404).json({ message: "Meal not found" });
        }

        if (
          existingMeal?.imageUrl &&
          mealData.imageUrl &&
          existingMeal.imageUrl !== mealData.imageUrl &&
          existingMeal.imageUrl.startsWith("/api/images/")
        ) {
          await deleteImage(existingMeal.imageUrl);
        }

        const globalCurryOptions = await CurryOption.find().lean();

        const formattedResult = {
          ...result,
          curryOptions:
            result.curryOptions && result.curryOptions.length > 0
              ? formatCurryOptions(result.curryOptions, mealId)
              : formatCurryOptions(
                  globalCurryOptions.filter((option: any) => {
                    const legacyMatch =
                      option.mealId === null || option.mealId === mealId;
                    const arrayMatch =
                      Array.isArray(option.mealIds) &&
                      option.mealIds.includes(mealId);
                    return legacyMatch || arrayMatch;
                  }),
                  mealId,
                ),
        };

        console.log(`Admin: Successfully updated meal with ID ${mealId}`);
        res.json(formattedResult);
      } catch (err) {
        console.error("Error updating meal:", err);
        res.status(500).json({ message: "Error updating meal" });
      }
    },
  );
}
