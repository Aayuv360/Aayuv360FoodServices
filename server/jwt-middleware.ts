import { Request, Response, NextFunction } from "express";
import {
  verifyAccessToken,
  extractTokenFromHeader,
  extractTokenFromCookie,
} from "./jwt-utils";
import { storage } from "./storage";
import { User } from "@shared/schema";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Checks for access token in Authorization header or cookies
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Try to get token from Authorization header first
  let token = extractTokenFromHeader(req.headers.authorization);

  // If not found in header, try cookies
  if (!token) {
    token = extractTokenFromCookie("accessToken", req.cookies);
  }

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      id: payload.userId,
      username: payload.username,
      email: payload.email,
    } as User;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * Optional JWT Authentication Middleware
 * Attaches user info if valid token exists, but doesn't require it
 */
export function optionalAuthenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Try to get token from Authorization header first
  let token = extractTokenFromHeader(req.headers.authorization);

  // If not found in header, try cookies
  if (!token) {
    token = extractTokenFromCookie("accessToken", req.cookies);
  }

  if (!token) {
    return next(); // No token, continue without user
  }

  try {
    const payload = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      id: payload.userId,
      username: payload.username,
      email: payload.email,
    } as User;
  } catch (error) {
    // Invalid token, but don't block the request
    console.log("Invalid token in optional auth:", error.message);
  }

  next();
}

/**
 * Get current user from database
 * Use this in protected routes to get full user details
 */
export async function getCurrentUser(req: Request): Promise<User | null> {
  if (!req.user) return null;

  try {
    const user = await storage.getUser(req.user.id);
    return user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

/**
 * Require authentication middleware
 * Returns 401 if user is not authenticated
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

/**
 * Require admin role middleware
 * Returns 403 if user is not admin
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log("req.user", req.user);
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const user = await storage.getUser(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Error checking admin role:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
