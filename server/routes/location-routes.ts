import type { Express, Request, Response } from "express";
import { mongoStorage } from "../mongoStorage";
import { authenticateToken } from "../jwt-middleware";

export function registerLocationRoutes(app: Express) {
  const isManagerOrAdmin = async (
    req: Request,
    res: Response,
    next: Function,
  ) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Get full user details from database to check role
      const fullUser = await mongoStorage.getUser(user.id);
      if (
        !fullUser ||
        (fullUser.role !== "manager" && fullUser.role !== "admin")
      ) {
        return res
          .status(403)
          .json({ message: "Access denied. Manager privileges required." });
      }
      next();
    } catch (error) {
      console.error("Error checking user role:", error);
      return res.status(500).json({ message: "Server error" });
    }
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
    authenticateToken,
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
    authenticateToken,
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
    authenticateToken,
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
