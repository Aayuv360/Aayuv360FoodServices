import redis from "../utils/redisClient";

export const cacheService = {
  async get(key: string) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key: string, value: any, ttl = 900) {
    await redis.setEx(key, ttl, JSON.stringify(value));
  },

  async del(key: string) {
    await redis.del(key);
  },
};
