import { createClient } from "redis";
import dotenv from "dotenv";

// Load environment based on NODE_ENV
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: envFile });

export const redisClient = createClient({
  url: "rediss://default:AVwLAAIjcDFmNTEyYzJjYzhkZmY0MTIxOTBiYjJjNTQ0YmZiYjE4ZnAxMA@capable-ferret-23563.upstash.io:6379",
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Error:", err);
});

redisClient.on("connect", () => {
  console.log("🔄 Redis connecting...");
});

redisClient.on("ready", () => {
  console.log("✅ Redis connected successfully");
});

redisClient.on("end", () => {
  console.log("🔌 Redis connection closed");
});

if (process.env.NODE_ENV === "production" && process.env.REDIS_URL) {
  redisClient.connect().catch((err) => {
    console.error("❌ Redis connection failed:", err);
    console.log("⚠️ Will use in-memory fallback for JWT tokens");
  });
} else {
  console.log(
    "⚠️ Using in-memory fallback for JWT tokens (Replit environment)",
  );
}

export default redisClient;
