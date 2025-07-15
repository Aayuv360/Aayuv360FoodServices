import jwt from "jsonwebtoken";
import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (err) => {
  console.log("Redis Client Error", err);
});

let isRedisConnected = false;
const connectToRedis = async () => {
  try {
    await redis.connect();
    isRedisConnected = true;
    console.log("✅ Redis connected successfully");
  } catch (error) {
    console.log(
      "⚠️  Redis connection failed, using in-memory fallback:",
      error.message,
    );
    isRedisConnected = false;
  }
};

// In-memory fallback for refresh tokens
const refreshTokenStore = new Map<string, string>();

// Connect to Redis
connectToRedis();

export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// JWT Configuration
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "your_access_token_secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your_refresh_token_secret";
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

/**
 * Generate access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(payload: JWTPayload): TokenPair {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { accessToken, refreshToken };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid access token");
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
}

/**
 * Store refresh token in Redis or fallback to in-memory
 */
export const storeRefreshToken = async (
  userId: number,
  refreshToken: string,
): Promise<void> => {
  const key = `refresh_token:${userId}`;
  const expiresInSeconds = 7 * 24 * 60 * 60; // 7 days

  if (isRedisConnected) {
    try {
      await redisClient.setEx(key, expiresInSeconds, refreshToken);
    } catch (error) {
      console.error("Redis store error:", error);
      // Fallback to in-memory
      refreshTokenStore.set(key, refreshToken);
    }
  } else {
    // Use in-memory fallback
    refreshTokenStore.set(key, refreshToken);
    // Set expiration for in-memory store
    setTimeout(() => {
      refreshTokenStore.delete(key);
    }, expiresInSeconds * 1000);
  }
};

/**
 * Get refresh token from Redis or fallback to in-memory
 */
export const getRefreshToken = async (
  userId: number,
): Promise<string | null> => {
  const key = `refresh_token:${userId}`;

  if (isRedisConnected) {
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.error("Redis get error:", error);
      return refreshTokenStore.get(key) || null;
    }
  } else {
    return refreshTokenStore.get(key) || null;
  }
};

/**
 * Remove refresh token from Redis or fallback to in-memory
 */
export const deleteRefreshToken = async (
  userId: number,
): Promise<void> => {
  const key = `refresh_token:${userId}`;

  if (isRedisConnected) {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error("Redis delete error:", error);
      refreshTokenStore.delete(key);
    }
  } else {
    refreshTokenStore.delete(key);
  }
};

/**
 * Remove all refresh tokens for a user (logout from all devices)
 */
export async function removeAllRefreshTokens(userId: number): Promise<void> {
  try {
    if (isRedisConnected) {
      const pattern = `refresh_token:${userId}*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } else {
      // Fallback to in-memory storage
      const pattern = `refresh_token:${userId}`;
      refreshTokenStore.delete(pattern);
    }
  } catch (error) {
    console.error("Error removing all refresh tokens:", error);
    // Fallback to in-memory storage
    const pattern = `refresh_token:${userId}`;
    refreshTokenStore.delete(pattern);
  }
}

/**
 * Check if refresh token exists in Redis or fallback to in-memory
 */
export async function isRefreshTokenValid(
  userId: number,
  refreshToken: string,
): Promise<boolean> {
  try {
    const storedToken = await getRefreshToken(userId);
    return storedToken === refreshToken;
  } catch (error) {
    console.error("Error validating refresh token:", error);
    return false;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(
  authHeader: string | undefined,
): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}

/**
 * Extract token from cookie
 */
export function extractTokenFromCookie(
  cookieName: string,
  cookies: any,
): string | null {
  return cookies[cookieName] || null;
}