const { cacheGet, cacheSet, cacheDel } = require('./redisClient');

// Cache keys
const CACHE_KEYS = {
    PRODUCTS: 'products:all',
    PRODUCT: (id) => `product:${id}`,
    ORDERS: (userId) => `orders:${userId}`,
    CART: (userId) => `cart:${userId}`,
    USER: (userId) => `user:${userId}`,
    SETTINGS: 'settings:all',
    FAQS: 'faqs:all',
    FAQ: (id) => `faq:${id}`
};

// Product caching
const cacheProducts = async (products) => {
    return await cacheSet(CACHE_KEYS.PRODUCTS, products, 3600); // 1 hour
};

const getCachedProducts = async () => {
    return await cacheGet(CACHE_KEYS.PRODUCTS);
};

const invalidateProducts = async () => {
    return await cacheDel(CACHE_KEYS.PRODUCTS);
};

// Single product caching
const cacheProduct = async (productId, product) => {
    return await cacheSet(CACHE_KEYS.PRODUCT(productId), product, 1800); // 30 mins
};

const getCachedProduct = async (productId) => {
    return await cacheGet(CACHE_KEYS.PRODUCT(productId));
};

const invalidateProduct = async (productId) => {
    return await cacheDel(CACHE_KEYS.PRODUCT(productId));
};

// User orders caching
const cacheUserOrders = async (userId, orders) => {
    return await cacheSet(CACHE_KEYS.ORDERS(userId), orders, 1800); // 30 mins
};

const getCachedUserOrders = async (userId) => {
    return await cacheGet(CACHE_KEYS.ORDERS(userId));
};

const invalidateUserOrders = async (userId) => {
    return await cacheDel(CACHE_KEYS.ORDERS(userId));
};

// Cart caching
const cacheUserCart = async (userId, cart) => {
    return await cacheSet(CACHE_KEYS.CART(userId), cart, 3600); // 1 hour
};

const getCachedUserCart = async (userId) => {
    return await cacheGet(CACHE_KEYS.CART(userId));
};

const invalidateUserCart = async (userId) => {
    return await cacheDel(CACHE_KEYS.CART(userId));
};

// Settings caching
const cacheSettings = async (settings) => {
    return await cacheSet(CACHE_KEYS.SETTINGS, settings, 7200); // 2 hours
};

const getCachedSettings = async () => {
    return await cacheGet(CACHE_KEYS.SETTINGS);
};

const invalidateSettings = async () => {
    return await cacheDel(CACHE_KEYS.SETTINGS);
};

// FAQs caching
const cacheFAQs = async (faqs) => {
    return await cacheSet(CACHE_KEYS.FAQS, faqs, 3600); // 1 hour
};

const getCachedFAQs = async () => {
    return await cacheGet(CACHE_KEYS.FAQS);
};

const invalidateFAQs = async () => {
    return await cacheDel(CACHE_KEYS.FAQS);
};

// User caching
const cacheUser = async (userId, user) => {
    return await cacheSet(CACHE_KEYS.USER(userId), user, 1800); // 30 mins
};

const getCachedUser = async (userId) => {
    return await cacheGet(CACHE_KEYS.USER(userId));
};

const invalidateUser = async (userId) => {
    return await cacheDel(CACHE_KEYS.USER(userId));
};

module.exports = {
    CACHE_KEYS,
    // Products
    cacheProducts,
    getCachedProducts,
    invalidateProducts,
    cacheProduct,
    getCachedProduct,
    invalidateProduct,
    // Orders
    cacheUserOrders,
    getCachedUserOrders,
    invalidateUserOrders,
    // Cart
    cacheUserCart,
    getCachedUserCart,
    invalidateUserCart,
    // Settings
    cacheSettings,
    getCachedSettings,
    invalidateSettings,
    // FAQs
    cacheFAQs,
    getCachedFAQs,
    invalidateFAQs,
    // User
    cacheUser,
    getCachedUser,
    invalidateUser
};
