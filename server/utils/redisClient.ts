
import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
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

redisClient.connect().catch((err) => {
  console.error("❌ Redis connection failed:", err);
  console.log("⚠️ Will use in-memory fallback for JWT tokens");
});

export default redisClient;
