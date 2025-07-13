import type { Express, Request, Response } from "express";
import { mongoStorage } from "../mongoStorage";

export function registerLocationRoutes(app: Express) {
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };
  const isManagerOrAdmin = (req: Request, res: Response, next: Function) => {
    const user = req.user as any;
    if (!user || (user.role !== "manager" && user.role !== "admin")) {
      return res
        .status(403)
        .json({ message: "Access denied. Manager privileges required." });
    }
    next();
  };
  app.get("/api/locations", async (req: Request, res: Response) => {
    try {
      const locations = await mongoStorage.getLocations();

      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Error fetching locations" });
    }
  });

  app.post(
    "/api/locations",
    isManagerOrAdmin,
    async (req: Request, res: Response) => {
      try {
        const location = req.body;
        const created = await mongoStorage.createLocation(location);
        res.status(201).json(created);
      } catch (error) {
        console.error("Error creating location:", error);
        res.status(500).json({ message: "Error creating location" });
      }
    },
  );

  app.put(
    "/api/locations/:id",
    isManagerOrAdmin,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const updatedData = req.body;
        const updated = await mongoStorage.updateLocation(id, updatedData);
        if (!updated) {
          return res.status(404).json({ message: "Location not found" });
        }
        res.json(updated);
      } catch (error) {
        console.error("Error updating location:", error);
        res.status(500).json({ message: "Error updating location" });
      }
    },
  );

  app.delete(
    "/api/locations/:id",
    isManagerOrAdmin,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const deleted = await mongoStorage.deleteLocation(id);
        if (!deleted) {
          return res.status(404).json({ message: "Location not found" });
        }
        res.json({ message: "Location deleted" });
      } catch (error) {
        console.error("Error deleting location:", error);
        res.status(500).json({ message: "Error deleting location" });
      }
    },
  );
}
