import redis from 'redis';

// Create Redis client with promise support (redis v4+)
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

// Initialize Redis connection
const initRedis = async () => {
    try {
        await client.connect();
        console.log('✅ Redis client connected');
    } catch (err) {
        console.warn('⚠️ Failed to connect to Redis:', err.message);
        console.warn('Continuing without Redis cache...');
    }
};

// Redis v4+ has built-in promise support, no need to promisify
const cacheGet = async (key) => {
    try {
        const data = await client.get(key);
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
            await client.setEx(key, expirySeconds, jsonValue);
        } else {
            await client.set(key, jsonValue);
        }
        return true;
    } catch (err) {
        console.warn(`Cache set error for ${key}:`, err.message);
        return false;
    }
};

const cacheDel = async (key) => {
    try {
        await client.del(key);
        return true;
    } catch (err) {
        console.warn(`Cache delete error for ${key}:`, err.message);
        return false;
    }
};

const cacheFlush = async () => {
    try {
        await client.flushDb();
        console.log('✅ Cache flushed');
        return true;
    } catch (err) {
        console.warn('Cache flush error:', err.message);
        return false;
    }
};

export {
    client,
    initRedis,
    cacheGet,
    cacheSet,
    cacheDel,
    cacheFlush
};
