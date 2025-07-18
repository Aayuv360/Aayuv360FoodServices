import { Express } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import {
  sanitizeInput,
  validateEmail,
  validatePassword,
  validatePhone,
} from "./security-middleware";
import { 
  generateTokens, 
  verifyRefreshToken, 
  storeRefreshToken, 
  deleteRefreshToken, 
  isRefreshTokenValid,
  extractTokenFromCookie 
} from "./jwt-utils";
import { authenticateToken } from "./jwt-middleware";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Hash password for database using bcrypt
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password using bcrypt
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return await bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  // JWT Cookie configuration
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for refresh token
  };

  const accessTokenCookieOptions = {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours for access token - no idle logout
  };

  // Authentication routes
  app.post(
    "/api/auth/register",
    sanitizeInput,
    validateEmail,
    validatePassword,
    validatePhone,
    async (req, res) => {
      try {
        const { username, password, email, name, phone, address } = req.body;

        // Check if user already exists
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }

        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user with hashed password
        const user = await storage.createUser({
          username,
          password: hashedPassword,
          email,
          name,
          phone,
          address,
        });

        // Generate JWT tokens
        const tokenPayload = {
          userId: user.id,
          username: user.username,
          email: user.email,
        };

        const { accessToken, refreshToken } = generateTokens(tokenPayload);

        // Store refresh token in Redis
        await storeRefreshToken(user.id, refreshToken);

        // Set tokens in httpOnly cookies
        res.cookie('accessToken', accessToken, accessTokenCookieOptions);
        res.cookie('refreshToken', refreshToken, cookieOptions);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
          user: userWithoutPassword,
          accessToken,
          message: "Registration successful"
        });
      } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ message: "Error creating user" });
      }
    }
  );

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Normalize input for case-insensitive search
      const normalizedInput = username.toLowerCase().trim();
      
      // Try to find user by username (case insensitive) or email
      let user = await storage.getUserByUsername(normalizedInput);
      
      // If not found by username, try email
      if (!user && normalizedInput.includes('@')) {
        user = await storage.getUserByEmail(normalizedInput);
      }

      if (!user) {
        return res.status(401).json({ message: "Incorrect username or email" });
      }

      const isPasswordValid = await comparePasswords(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      // Generate JWT tokens
      const tokenPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
      };

      const { accessToken, refreshToken } = generateTokens(tokenPayload);

      // Store refresh token in Redis
      await storeRefreshToken(user.id, refreshToken);

      // Set tokens in httpOnly cookies
      res.cookie('accessToken', accessToken, accessTokenCookieOptions);
      res.cookie('refreshToken', refreshToken, cookieOptions);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        accessToken,
        message: "Login successful"
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Error during login" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const refreshToken = extractTokenFromCookie('refreshToken', req.cookies);

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token required" });
      }

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Check if refresh token exists in Redis
      const isValid = await isRefreshTokenValid(payload.userId, refreshToken);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      // Generate new access token
      const tokenPayload = {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
      };

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenPayload);

      // Store new refresh token in Redis
      await storeRefreshToken(payload.userId, newRefreshToken);

      // Set new tokens in httpOnly cookies
      res.cookie('accessToken', accessToken, accessTokenCookieOptions);
      res.cookie('refreshToken', newRefreshToken, cookieOptions);

      res.json({
        accessToken,
        message: "Token refreshed successfully"
      });
    } catch (err) {
      console.error("Token refresh error:", err);
      res.status(401).json({ message: "Invalid refresh token" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req, res) => {
    try {
      if (req.user) {
        // Remove refresh token from Redis
        await deleteRefreshToken(req.user.id);
      }

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({ message: "Logged out successfully" });
    } catch (err) {
      console.error("Logout error:", err);
      res.status(500).json({ message: "Error during logout" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get full user details from database
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      console.error("Get user error:", err);
      res.status(500).json({ message: "Error fetching user data" });
    }
  });
}
