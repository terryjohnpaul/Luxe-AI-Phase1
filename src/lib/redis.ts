import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedis(): Redis {
  try {
    const url = process.env.REDIS_URL;
    if (!url) {
      // Return a dummy redis that won't crash on missing connection
      return new Redis({ lazyConnect: true, maxRetriesPerRequest: null, enableReadyCheck: false });
    }
    return new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
  } catch {
    return new Redis({ lazyConnect: true, maxRetriesPerRequest: null, enableReadyCheck: false });
  }
}

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
