import redis from 'redis';
import { promisify } from 'util';

// Create Redis client
const redisConfig = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || null
    };

const client = redis.createClient(redisConfig);

// Handle Redis events
client.on('connect', () => {
    console.log('✅ Redis connected');
});

client.on('error', (err) => {
    console.warn('⚠️ Redis error:', err.message);
});

client.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
});

// Promisify Redis commands
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const setexAsync = promisify(client.setex).bind(client);
const delAsync = promisify(client.del).bind(client);
const flushdbAsync = promisify(client.flushdb).bind(client);

// Helper functions with error handling
const cacheGet = async (key) => {
    try {
        const data = await getAsync(key);
        if (data) {
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        }
        return null;
    } catch (err) {
        console.warn(`Cache get error for ${key}:`, err.message);
        return null;
    }
};

const cacheSet = async (key, value, expirySeconds = 3600) => {
    try {
        const jsonValue = JSON.stringify(value);
        if (expirySeconds) {
            await setexAsync(key, expirySeconds, jsonValue);
        } else {
            await setAsync(key, jsonValue);
        }
        return true;
    } catch (err) {
        console.warn(`Cache set error for ${key}:`, err.message);
        return false;
    }
};

const cacheDel = async (key) => {
    try {
        await delAsync(key);
        return true;
    } catch (err) {
        console.warn(`Cache delete error for ${key}:`, err.message);
        return false;
    }
};

const cacheFlush = async () => {
    try {
        await flushdbAsync();
        console.log('✅ Cache flushed');
        return true;
    } catch (err) {
        console.warn('Cache flush error:', err.message);
        return false;
    }
};

export {
    client,
    cacheGet,
    cacheSet,
    cacheDel,
    cacheFlush
};
