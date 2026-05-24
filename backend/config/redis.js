const redis = require('redis');

// Redis client setup
const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            console.warn('Redis connection refused. Using database fallback.');
            return new Error('Redis connection failed');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Redis retry time exhausted');
        }
        return Math.min(options.attempt * 100, 3000);
    }
});

// Error handling
client.on('error', (err) => {
    console.error('Redis Error:', err);
});

client.on('connect', () => {
    console.log('✅ Redis Connected Successfully');
});

client.on('ready', () => {
    console.log('✅ Redis Ready');
});

// Helper functions
const cacheSet = (key, value, expirySeconds = 3600) => {
    return new Promise((resolve, reject) => {
        try {
            const jsonValue = JSON.stringify(value);
            if (expirySeconds) {
                client.setex(key, expirySeconds, jsonValue, (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            } else {
                client.set(key, jsonValue, (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            }
        } catch (err) {
            reject(err);
        }
    });
};

const cacheGet = (key) => {
    return new Promise((resolve, reject) => {
        try {
            client.get(key, (err, data) => {
                if (err) reject(err);
                else {
                    if (data) {
                        try {
                            resolve(JSON.parse(data));
                        } catch {
                            resolve(data);
                        }
                    } else {
                        resolve(null);
                    }
                }
            });
        } catch (err) {
            reject(err);
        }
    });
};

const cacheDel = (key) => {
    return new Promise((resolve, reject) => {
        try {
            client.del(key, (err) => {
                if (err) reject(err);
                else resolve(true);
            });
        } catch (err) {
            reject(err);
        }
    });
};

const cacheFlush = () => {
    return new Promise((resolve, reject) => {
        try {
            client.flushdb((err) => {
                if (err) reject(err);
                else resolve(true);
            });
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = {
    client,
    cacheSet,
    cacheGet,
    cacheDel,
    cacheFlush
};
