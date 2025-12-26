import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export interface CacheOptions {
    ttl?: number; // Time to live in seconds
}

const DEFAULT_TTL = 3600; // 1 hour

/**
 * Initialize Redis client connection
 */
export const initRedis = async (): Promise<RedisClientType> => {
    if (redisClient && redisClient.isReady) {
        return redisClient;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = createClient({
        url: redisUrl,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    console.error('Redis: Max reconnection attempts reached');
                    return new Error('Max reconnection attempts reached');
                }
                return Math.min(retries * 100, 3000);
            }
        }
    });

    redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
        console.log('✅ Redis: Connected');
    });

    redisClient.on('ready', () => {
        console.log('✅ Redis: Ready to accept commands');
    });

    redisClient.on('reconnecting', () => {
        console.log('🔄 Redis: Reconnecting...');
    });

    await redisClient.connect();
    return redisClient;
};

/**
 * Get Redis client instance
 */
export const getRedisClient = (): RedisClientType | null => {
    return redisClient;
};

/**
 * Cache a value with optional TTL
 */
export const cacheSet = async (
    key: string,
    value: any,
    options: CacheOptions = {}
): Promise<void> => {
    if (!redisClient || !redisClient.isReady) {
        console.warn('Redis not available, skipping cache set');
        return;
    }

    const ttl = options.ttl || DEFAULT_TTL;
    const serializedValue = JSON.stringify(value);

    await redisClient.setEx(key, ttl, serializedValue);
};

/**
 * Get a cached value
 */
export const cacheGet = async <T>(key: string): Promise<T | null> => {
    if (!redisClient || !redisClient.isReady) {
        console.warn('Redis not available, skipping cache get');
        return null;
    }

    const value = await redisClient.get(key);
    if (!value) return null;

    try {
        return JSON.parse(value) as T;
    } catch {
        return value as unknown as T;
    }
};

/**
 * Delete a cached value
 */
export const cacheDel = async (key: string): Promise<void> => {
    if (!redisClient || !redisClient.isReady) {
        return;
    }

    await redisClient.del(key);
};

/**
 * Delete all keys matching a pattern
 */
export const cacheDelPattern = async (pattern: string): Promise<void> => {
    if (!redisClient || !redisClient.isReady) {
        return;
    }

    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
        await redisClient.del(keys);
    }
};

/**
 * Check if a key exists in cache
 */
export const cacheExists = async (key: string): Promise<boolean> => {
    if (!redisClient || !redisClient.isReady) {
        return false;
    }

    const exists = await redisClient.exists(key);
    return exists === 1;
};

/**
 * Close Redis connection gracefully
 */
export const closeRedis = async (): Promise<void> => {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        console.log('Redis: Connection closed');
    }
};

/**
 * Cache decorator function for wrapping async functions
 */
export const withCache = <T>(
    keyGenerator: (...args: any[]) => string,
    options: CacheOptions = {}
) => {
    return (
        _target: any,
        _propertyKey: string,
        descriptor: PropertyDescriptor
    ) => {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const cacheKey = keyGenerator(...args);

            // Try to get from cache first
            const cached = await cacheGet<T>(cacheKey);
            if (cached !== null) {
                return cached;
            }

            // Call original method
            const result = await originalMethod.apply(this, args);

            // Cache the result
            await cacheSet(cacheKey, result, options);

            return result;
        };

        return descriptor;
    };
};
