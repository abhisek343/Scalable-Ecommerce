// Local Redis client wrapper for user-service
import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

const DEFAULT_TTL = 3600; // 1 hour

export const initRedis = async (): Promise<RedisClientType> => {
    if (redisClient && redisClient.isReady) {
        return redisClient;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = createClient({
        url: redisUrl,
        socket: {
            reconnectStrategy: (retries: number) => {
                if (retries > 10) return new Error('Max reconnection attempts reached');
                return Math.min(retries * 100, 3000);
            }
        }
    });

    redisClient.on('error', (err: Error) => console.error('Redis Client Error:', err));
    redisClient.on('connect', () => console.log('✅ Redis: Connected'));

    await redisClient.connect();
    return redisClient;
};

export const cacheSet = async (key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> => {
    if (!redisClient || !redisClient.isReady) return;
    await redisClient.setEx(key, ttl, JSON.stringify(value));
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
    if (!redisClient || !redisClient.isReady) return null;
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) as T : null;
};

export const cacheDel = async (key: string): Promise<void> => {
    if (!redisClient || !redisClient.isReady) return;
    await redisClient.del(key);
};

export const closeRedis = async (): Promise<void> => {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
};
