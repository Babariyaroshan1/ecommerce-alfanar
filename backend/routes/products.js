import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { auth, adminAuth, adminOrCoadminAuth, permissionAuth } from '../middleware/auth.js';
import { getCurrentCurrencySettings, convertPrice } from '../utils/currency.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { getCachedProducts, cacheProducts, invalidateProducts, getCachedProduct, cacheProduct, invalidateProduct } from '../utils/cacheService.js';
import { createHistoryLog, buildHistoryEntry } from '../utils/historyService.js';

const router = express.Router();
const getPriceValue = (prices, key) => {
    if (!prices) return undefined;
    if (typeof prices.get === 'function') return prices.get(key);
    return prices[key];
};

const parseBooleanValue = (value) => {
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    if (typeof value === 'number') return value !== 0;
    return Boolean(value);
};

// Get all products
router.get('/', async (req, res) => {
    try {
        // Try to get from cache first
        const cachedProducts = await getCachedProducts();
        if (cachedProducts && cachedProducts.length > 0) {
            const currencySettings = await getCurrentCurrencySettings();
            return res.json({
                products: cachedProducts,
                totalPages: 1,
                currentPage: 1,
                total: cachedProducts.length,
                currencySettings,
                cached: true
            });
        }

        // If not in cache, fetch from database
        const [products, currencySettings] = await Promise.all([
            Product.find().lean(),
            getCurrentCurrencySettings()
        ]);

        const productsWithCurrency = products.map(product => {
            let displayPrice = null;
            let displayOriginalPrice = null;
            const priceKey = currencySettings.currency;
            const originalPriceKey = `${currencySettings.currency}_original`;

            const specificPrice = getPriceValue(product.prices, priceKey);
            if (specificPrice !== undefined && specificPrice !== null) {
                displayPrice = specificPrice;
            } else {
                displayPrice = convertPrice(product.price, currencySettings.currency).price;
            }

            if (product.originalPrice) {
                const specificOriginalPrice = getPriceValue(product.prices, originalPriceKey);
                if (specificOriginalPrice !== undefined && specificOriginalPrice !== null) {
                    displayOriginalPrice = specificOriginalPrice;
                } else {
                    displayOriginalPrice = convertPrice(product.originalPrice, currencySettings.currency).price;
                }
            }

            console.log(`[GET] Product ${product._id}: isNew=${Boolean(product.isNew)}`);
            return {
                ...product,
                displayPrice,
                displayOriginalPrice,
                currency: currencySettings.currency,
                currencySymbol: currencySettings.symbol,
                country: currencySettings.country
            };
        });

        // Cache the products
        await cacheProducts(productsWithCurrency);

        res.json({
            products: productsWithCurrency,
            totalPages: 1,
            currentPage: 1,
            total: productsWithCurrency.length,
            currencySettings,
            cached: false
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all product categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Product.distinct('category', { category: { $exists: true, $ne: '' } });
        const sortedCategories = categories
            .filter((category) => category && category.toString().trim())
            .map((category) => category.toString())
            .sort((a, b) => a.localeCompare(b));

        res.json(sortedCategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Try to get from cache first
        let cachedProduct = await getCachedProduct(req.params.id);
        if (cachedProduct) {
            return res.json({
                ...cachedProduct,
                cached: true
            });
        }

        // If not in cache, fetch from database
        const product = await Product.findById(req.params.id).lean();
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const currencySettings = await getCurrentCurrencySettings();

        const getPriceValue = (prices, key) => {
            if (!prices) return undefined;
            if (typeof prices.get === 'function') return prices.get(key);
            return prices[key];
        };

        let displayPrice = null;
        let displayOriginalPrice = null;
        const priceKey = currencySettings.currency;
        const originalPriceKey = `${currencySettings.currency}_original`;

        const specificPrice = getPriceValue(product.prices, priceKey);
        if (specificPrice !== undefined && specificPrice !== null) {
            displayPrice = specificPrice;
        } else {
            displayPrice = convertPrice(product.price, currencySettings.currency).price;
        }

        if (product.originalPrice) {
            const specificOriginalPrice = getPriceValue(product.prices, originalPriceKey);
            if (specificOriginalPrice !== undefined && specificOriginalPrice !== null) {
                displayOriginalPrice = specificOriginalPrice;
            } else {
                displayOriginalPrice = convertPrice(product.originalPrice, currencySettings.currency).price;
            }
        }

        const productResponse = {
            ...product,
            displayPrice,
            displayOriginalPrice,
            currency: currencySettings.currency,
            currencySymbol: currencySettings.symbol,
            country: currencySettings.country
        };

        // Cache the product
        await cacheProduct(req.params.id, productResponse);

        res.json({
            ...productResponse,
            cached: false
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update product (Admin and authorized Coadmin - with permission-based check for kids products)
router.put('/:id', async (req, res) => {
    try {
        const { isKidsProduct } = req.body;
        const isKidsProductBool = parseBooleanValue(isKidsProduct);

        // Determine required permission based on product type
        const requiredPermission = isKidsProductBool ? PERMISSIONS.MANAGE_KIDS_PRODUCTS : PERMISSIONS.MANAGE_PRODUCTS;

        // Use permissionAuth middleware
        return permissionAuth(requiredPermission)(req, res, async () => {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(404).json({ message: 'Product not found' });
            }

            const clientInfo = req.body.clientInfo || {};
            const historyPayload = req.body.historyPayload || {};
            let updateData = { ...req.body };
            delete updateData.clientInfo;
            delete updateData.historyPayload;

            // Parse JSON strings sent from FormData
            try {
                if (typeof updateData.colors === 'string') updateData.colors = JSON.parse(updateData.colors);
                if (typeof updateData.sizes === 'string') updateData.sizes = JSON.parse(updateData.sizes);
                if (typeof updateData.prices === 'string') updateData.prices = JSON.parse(updateData.prices);
                if (typeof updateData.stock === 'string') updateData.stock = JSON.parse(updateData.stock);
            } catch (parseError) {
                return res.status(400).json({ message: 'Invalid JSON format in colors, sizes, prices, or stock fields' });
            }

            if ('isNew' in updateData) {
                updateData.isNewArrival = parseBooleanValue(updateData.isNew);
                delete updateData.isNew;
            }

            if ('isFeaturedOnHome' in updateData) {
                updateData.isFeaturedOnHome = parseBooleanValue(updateData.isFeaturedOnHome);
            }

            if ('isKidsProduct' in updateData) {
                updateData.isKidsProduct = parseBooleanValue(updateData.isKidsProduct);
            }

            if (updateData.images) {
                updateData.images = Array.isArray(updateData.images)
                    ? updateData.images.filter(img => img && typeof img === 'string' && img.trim().length > 0)
                    : [];
            } else {
                updateData.images = [];
            }

            if (updateData.colors) {
                updateData.colors = Array.isArray(updateData.colors)
                    ? updateData.colors.filter(color => color && typeof color === 'string' && color.trim().length > 0)
                    : [];
            }

            // Handle prices Map
            if (updateData.prices && typeof updateData.prices === 'object') {
                updateData.prices = Object.fromEntries(
                    Object.entries(updateData.prices)
                        .filter(([, value]) => value !== undefined && value !== null && value !== '')
                        .map(([key, value]) => [key, Number(value) || 0])
                );
            }

            // Normalize stock object for mongoose Map<Number>
            if (updateData.stock && typeof updateData.stock === 'object' && !Array.isArray(updateData.stock)) {
                updateData.stock = Object.fromEntries(
                    Object.entries(updateData.stock)
                        .filter(([, value]) => value !== undefined && value !== null && value !== '')
                        .map(([key, value]) => [key, Number(value) || 0])
                );
                updateData.totalStock = Object.values(updateData.stock).reduce((sum, num) => sum + Number(num || 0), 0);
            }

            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            // Validate kidsType if isKidsProduct is being set to true
            const isKidsProductBool = updateData.isKidsProduct !== undefined
                ? (typeof updateData.isKidsProduct === 'string' ? updateData.isKidsProduct.toLowerCase() === 'true' : Boolean(updateData.isKidsProduct))
                : product.isKidsProduct;

            if (isKidsProductBool) {
                const kidsTypeToUse = updateData.kidsType || product.kidsType;
                if (!kidsTypeToUse) {
                    return res.status(400).json({ message: 'kidsType is required for kids products' });
                }
                const validKidsTypes = ['boys', 'girls', 'unisex', 'baby', 'teens', 'custom'];
                if (!validKidsTypes.includes(kidsTypeToUse)) {
                    return res.status(400).json({ message: `Invalid kidsType. Must be one of: ${validKidsTypes.join(', ')}` });
                }
            }

            console.log('[PUT] Update request for product:', req.params.id);
            console.log('[PUT] updateData.isNew before processing:', updateData.isNew, 'type:', typeof updateData.isNew);
            console.log('[PUT] Current product.isNew before update:', product.isNew);

            // 🔥 FIX: Properly updating Mongoose Map
            if (updateData.stock) {
                if (!product.stock) {
                    product.stock = new Map();
                } else {
                    product.stock.clear();
                }
                for (const [key, value] of Object.entries(updateData.stock)) {
                    product.stock.set(key, value);
                }
                delete updateData.stock;
            }

            // 🔥 FIX: Properly updating prices Map
            if (updateData.prices) {
                if (!product.prices) {
                    product.prices = new Map();
                } else {
                    product.prices.clear();
                }
                for (const [key, value] of Object.entries(updateData.prices)) {
                    product.prices.set(key, value);
                }
                delete updateData.prices;
            }

            // Update each field explicitly to ensure isNew is set
            Object.keys(updateData).forEach(key => {
                product[key] = updateData[key];
            });

            // Clear kidsType if isKidsProduct is false
            if (!product.isKidsProduct) {
                product.kidsType = null;
            }

            console.log('[PUT] After setting fields, product.isNew:', product.isNew);

            await product.save();
            console.log('[PUT] After save, product.isNew in DB:', product.isNew);

            const savedProduct = product.toObject({ flattenMaps: true });
            console.log('[PUT] Response isNew:', savedProduct.isNew);

            await createHistoryLog(await buildHistoryEntry({
                req,
                entityType: 'Product',
                entityId: product._id,
                entityName: product.name,
                actionType: 'update',
                description: historyPayload.description || `Product updated by ${req.role}`,
                metadata: {
                    changedFields: Object.keys(updateData),
                    updatedValues: updateData,
                    historyPayload
                },
                clientInfo,
                ipAddress: req.ip
            }));

            // Invalidate caches
            await invalidateProducts();
            await invalidateProduct(req.params.id);

            res.json({ message: 'Product updated successfully', product: savedProduct });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Add product (Admin and authorized Coadmin - with permission-based check for kids products)
router.post('/', async (req, res) => {
    try {
        const { isKidsProduct } = req.body;
        const isKidsProductBool = parseBooleanValue(isKidsProduct);

        // Determine required permission based on product type
        const requiredPermission = isKidsProductBool ? PERMISSIONS.MANAGE_KIDS_PRODUCTS : PERMISSIONS.MANAGE_PRODUCTS;

        // Use permissionAuth middleware
        return permissionAuth(requiredPermission)(req, res, async () => {
            let { name, description, materialAndCare, countryOfOrigin, price, prices, originalPrice, discount, image, images, category, colors, sizes, stock, allowReturn, allowReplacement, isNew, isFeaturedOnHome, showSameColorButton, kidsType } = req.body;

            console.log('📦 DEBUG - Creating product:', {
                name,
                imagesReceived: images,
                imagesType: typeof images,
                imagesIsArray: Array.isArray(images),
                imagesLength: images?.length,
            });

            // Parse JSON strings sent from FormData
            try {
                if (typeof colors === 'string') colors = JSON.parse(colors);
                if (typeof sizes === 'string') sizes = JSON.parse(sizes);
                if (typeof prices === 'string') prices = JSON.parse(prices);
                if (typeof stock === 'string') stock = JSON.parse(stock);
            } catch (parseError) {
                return res.status(400).json({ message: 'Invalid JSON format in colors, sizes, prices, or stock fields' });
            }

            if (!name || !category || !price || !colors?.length || !sizes?.length) {
                return res.status(400).json({ message: 'Missing required fields: name, category, price, colors, sizes' });
            }

            // Validate kidsType if isKidsProduct is true
            if (isKidsProductBool && !kidsType) {
                return res.status(400).json({ message: 'kidsType is required for kids products' });
            }

            const validKidsTypes = ['boys', 'girls', 'unisex', 'baby', 'teens', 'custom'];
            if (isKidsProductBool && kidsType && !validKidsTypes.includes(kidsType)) {
                return res.status(400).json({ message: `Invalid kidsType. Must be one of: ${validKidsTypes.join(', ')}` });
            }

            const imagesArray = Array.isArray(images) ? images.filter(Boolean) : [];
            console.log('📦 DEBUG - After filtering:', {
                imagesFiltered: imagesArray,
                filteredLength: imagesArray.length,
            });

            const product = new Product({
                name,
                description,
                materialAndCare,
                countryOfOrigin,
                price,
                prices: prices || {},
                originalPrice,
                discount,
                image,
                images: imagesArray,
                category,
                colors,
                sizes,
                stock,
                allowReturn: allowReturn !== undefined ? allowReturn : true,
                allowReplacement: allowReplacement !== undefined ? allowReplacement : true,
                isNewArrival: parseBooleanValue(isNew),
                isFeaturedOnHome: parseBooleanValue(isFeaturedOnHome),
                isKidsProduct: isKidsProductBool,
                kidsType: isKidsProductBool ? kidsType : null,
                showSameColorButton: parseBooleanValue(showSameColorButton)
            });

            await product.save();

            console.log('✅ DEBUG - Product saved:', {
                _id: product._id,
                name: product.name,
                imagesSaved: product.images,
                imagesLength: product.images?.length,
            });

            const clientInfo = req.body?.clientInfo || {};
            const historyPayload = req.body?.historyPayload || {};

            await createHistoryLog(await buildHistoryEntry({
                req,
                entityType: 'Product',
                entityId: product._id,
                entityName: product.name,
                actionType: 'create',
                description: historyPayload.description || `Product created by ${req.role}`,
                metadata: {
                    createdProduct: product.toObject({ flattenMaps: true }),
                    historyPayload
                },
                clientInfo,
                ipAddress: req.ip
            }));

            // 🔥 IMPORTANT: Invalidate ALL caches - don't let stale data persist
            await invalidateProducts();
            await invalidateProduct(product._id.toString());

            res.status(201).json({ message: 'Product added successfully', product });
        });
    } catch (error) {
        console.error('❌ DEBUG - Product creation error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update product (Admin and Coadmin)


// Delete product (Admin and authorized Coadmin)
router.delete('/:id', async (req, res) => {
    try {
        const clientInfo = req.body?.clientInfo || {};
        const historyPayload = req.body?.historyPayload || {};

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if it's a kids product to determine required permission
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const requiredPermission = product.isKidsProduct ? PERMISSIONS.MANAGE_KIDS_PRODUCTS : PERMISSIONS.MANAGE_PRODUCTS;

        // Use permissionAuth middleware
        return permissionAuth(requiredPermission)(req, res, async () => {

            await Product.findByIdAndDelete(req.params.id);

            await createHistoryLog(await buildHistoryEntry({
                req,
                entityType: 'Product',
                entityId: product._id,
                entityName: product.name,
                actionType: 'delete',
                description: historyPayload.description || `Deleted product ${product.name} (${product._id})`,
                metadata: {
                    deletedProduct: product.toObject({ flattenMaps: true }),
                    historyPayload
                },
                clientInfo,
                ipAddress: req.ip
            }));

            // Invalidate caches
            await invalidateProducts();
            await invalidateProduct(req.params.id);

            res.json({ message: 'Product deleted successfully' });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
