
import type { Express, Request, Response } from "express";
import { mongoStorage } from "../mongoStorage";

export function registerLocationRoutes(app: Express) {
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await mongoStorage.getLocations();
      if (!locations || locations.length === 0) {
        console.log(
          "No locations found in database, seeding default locations"
        );
        const defaultLocations = [
          { id: 1, area: "Gachibowli", pincode: "500032", deliveryFee: 30 },
        ];

        for (const location of defaultLocations) {
          await mongoStorage.createLocation(location);
        }
        return res.json(defaultLocations);
      }

      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Error fetching locations" });
    }
  });
}
