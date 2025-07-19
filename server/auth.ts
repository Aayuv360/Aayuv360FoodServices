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
  extractTokenFromCookie,
} from "./jwt-utils";
import { authenticateToken } from "./jwt-middleware";
import jwt from "jsonwebtoken";

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
export async function comparePasswords(
  supplied: string,
  stored: string,
): Promise<boolean> {
  return await bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  // JWT Cookie configuration - Enhanced Security
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production - prevents MITM attacks
    sameSite: isProduction ? ("none" as const) : ("lax" as const), // CSRF protection
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
        res.cookie("accessToken", accessToken, accessTokenCookieOptions);
        res.cookie("refreshToken", refreshToken, cookieOptions);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
          user: userWithoutPassword,
          accessToken,
          message: "Registration successful",
        });
      } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ message: "Error creating user" });
      }
    },
  );

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Username and password are required" });
      }

      // Normalize input for case-insensitive search
      const normalizedInput = username.toLowerCase().trim();

      // Try to find user by username (case insensitive) or email
      let user = await storage.getUserByUsername(normalizedInput);

      // If not found by username, try email
      if (!user && normalizedInput.includes("@")) {
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
      res.cookie("accessToken", accessToken, accessTokenCookieOptions);
      res.cookie("refreshToken", refreshToken, cookieOptions);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        accessToken,
        message: "Login successful",
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Error during login" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const refreshToken = extractTokenFromCookie("refreshToken", req.cookies);

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

      const { accessToken, refreshToken: newRefreshToken } =
        generateTokens(tokenPayload);

      // Store new refresh token in Redis
      await storeRefreshToken(payload.userId, newRefreshToken);

      // Set new tokens in httpOnly cookies
      res.cookie("accessToken", accessToken, accessTokenCookieOptions);
      res.cookie("refreshToken", newRefreshToken, cookieOptions);

      res.json({
        accessToken,
        message: "Token refreshed successfully",
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
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

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

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      console.error("Get user error:", err);
      res.status(500).json({ message: "Error fetching user data" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({
          message: "If your email is registered, you will receive a reset link",
        });
      }

      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.ACCESS_TOKEN_SECRET || "your_access_token_secret",
        { expiresIn: "1h" },
      );

      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await storage.updateUser(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      });

      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

      try {
        const { emailService } = await import("./email-service-nodemailer");
        await emailService.sendPasswordReset(email, resetToken, resetUrl);
        console.log(`Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
      }

      res.json({
        message: "If your email is registered, you will receive a reset link",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res
        .status(500)
        .json({ message: "Error processing password reset request" });
    }
  });

  // Reset Password endpoint
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res
          .status(400)
          .json({ message: "Token and new password are required" });
      }

      let decoded;
      try {
        decoded = jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET || "your_access_token_secret",
        ) as any;
      } catch (error) {
        return res
          .status(400)
          .json({ message: "Invalid or expired reset token" });
      }

      const user = await storage.getUser(decoded.userId);
      if (!user || user.resetPasswordToken !== token) {
        return res.status(400).json({ message: "Invalid reset token" });
      }

      if (
        !user.resetPasswordExpires ||
        new Date() > user.resetPasswordExpires
      ) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters long" });
      }

      const hashedPassword = await hashPassword(newPassword);

      await storage.updateUser(user.id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Error resetting password" });
    }
  });
}
