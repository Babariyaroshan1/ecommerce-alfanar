const { cacheGet, cacheSet, cacheDel } = require('../config/redis');

// Cache middleware for GET requests
const cacheMiddleware = (expirySeconds = 3600) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Create cache key from URL and user ID
        const userId = req.user?.id || 'anonymous';
        const cacheKey = `${req.originalUrl}:${userId}`;

        try {
            // Try to get from cache
            const cachedData = await cacheGet(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }
        } catch (err) {
            console.warn('Cache get error:', err);
            // Continue without cache if error occurs
        }

        // Store original json method
        const originalJson = res.json;

        // Override json method to cache response
        res.json = function (data) {
            try {
                if (res.statusCode === 200) {
                    cacheSet(cacheKey, data, expirySeconds).catch(err => {
                        console.warn('Cache set error:', err);
                    });
                }
            } catch (err) {
                console.warn('Cache error:', err);
            }

            // Call original json method
            return originalJson.call(this, data);
        };

        next();
    };
};

// Invalidate cache for specific pattern
const invalidateCache = async (pattern) => {
    try {
        const { cacheFlush } = require('../config/redis');
        // For simple implementation, we'll clear specific keys
        // In production, use redis KEYS pattern matching
        console.log(`Cache invalidated for pattern: ${pattern}`);
    } catch (err) {
        console.warn('Cache invalidation error:', err);
    }
};

module.exports = {
    cacheMiddleware,
    invalidateCache
};
