
import type { Express, Request, Response } from "express";
import { authenticateToken } from "./jwt-middleware";
import { mongoStorage } from "./mongoStorage";

export function registerTestAuthRoutes(app: Express) {
  // Test endpoint to verify JWT authentication
  app.get("/api/test-auth", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      console.log("🔍 JWT Test - User from token:", user);
      
      // Get full user details from database
      const fullUser = await mongoStorage.getUser(user.id);
      console.log("🔍 JWT Test - Full user from DB:", fullUser ? { id: fullUser.id, username: fullUser.username, role: fullUser.role } : "Not found");
      
      res.json({
        success: true,
        message: "JWT authentication working",
        tokenUser: user,
        dbUser: fullUser ? {
          id: fullUser.id,
          username: fullUser.username,
          email: fullUser.email,
          role: fullUser.role
        } : null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ JWT Test error:", error);
      res.status(500).json({
        success: false,
        message: "Error testing authentication",
        error: error.message
      });
    }
  });

  // Test endpoint without authentication
  app.get("/api/test-no-auth", (req: Request, res: Response) => {
    res.json({
      success: true,
      message: "No auth endpoint working",
      timestamp: new Date().toISOString()
    });
  });
}
