import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { auth, adminAuth, adminOrCoadminAuth, permissionAuth } from '../middleware/auth.js';
import { getCurrentCurrencySettings, convertPrice } from '../utils/currency.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = express.Router();
const getPriceValue = (prices, key) => {
    if (!prices) return undefined;
    if (typeof prices.get === 'function') return prices.get(key);
    return prices[key];
};

// Get all products
router.get('/', async (req, res) => {
    try {
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

        res.json({
            products: productsWithCurrency,
            totalPages: 1,
            currentPage: 1,
            total: productsWithCurrency.length,
            currencySettings
        });
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

        res.json({
            ...product,
            displayPrice,
            displayOriginalPrice,
            currency: currencySettings.currency,
            currencySymbol: currencySettings.symbol,
            country: currencySettings.country
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update product (Admin and authorized Coadmin)
router.put('/:id', permissionAuth(PERMISSIONS.MANAGE_PRODUCTS), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let updateData = { ...req.body };

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
            if (typeof updateData.isNew === 'string') {
                updateData.isNew = updateData.isNew.toLowerCase() === 'true';
            } else if (typeof updateData.isNew === 'number') {
                updateData.isNew = updateData.isNew !== 0;
            } else {
                updateData.isNew = Boolean(updateData.isNew);
            }
        }

        if ('isFeaturedOnHome' in updateData) {
            if (typeof updateData.isFeaturedOnHome === 'string') {
                updateData.isFeaturedOnHome = updateData.isFeaturedOnHome.toLowerCase() === 'true';
            } else if (typeof updateData.isFeaturedOnHome === 'number') {
                updateData.isFeaturedOnHome = updateData.isFeaturedOnHome !== 0;
            } else {
                updateData.isFeaturedOnHome = Boolean(updateData.isFeaturedOnHome);
            }
        }

        if ('isKidsProduct' in updateData) {
            if (typeof updateData.isKidsProduct === 'string') {
                updateData.isKidsProduct = updateData.isKidsProduct.toLowerCase() === 'true';
            } else if (typeof updateData.isKidsProduct === 'number') {
                updateData.isKidsProduct = updateData.isKidsProduct !== 0;
            } else {
                updateData.isKidsProduct = Boolean(updateData.isKidsProduct);
            }
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
        res.json({ message: 'Product updated successfully', product: savedProduct });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Add product (Admin and authorized Coadmin)
router.post('/', permissionAuth(PERMISSIONS.MANAGE_PRODUCTS), async (req, res) => {
    try {
        let { name, description, materialAndCare, countryOfOrigin, price, prices, originalPrice, discount, image, images, category, colors, sizes, stock, allowReturn, allowReplacement, isNew, isFeaturedOnHome, showSameColorButton, isKidsProduct, kidsType } = req.body;

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
        const isKidsProductBool = typeof isKidsProduct === 'string' ? isKidsProduct.toLowerCase() === 'true' : Boolean(isKidsProduct);
        if (isKidsProductBool && !kidsType) {
            return res.status(400).json({ message: 'kidsType is required for kids products' });
        }

        const validKidsTypes = ['boys', 'girls', 'unisex', 'baby', 'teens', 'custom'];
        if (isKidsProductBool && kidsType && !validKidsTypes.includes(kidsType)) {
            return res.status(400).json({ message: `Invalid kidsType. Must be one of: ${validKidsTypes.join(', ')}` });
        }

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
            images: Array.isArray(images) ? images.filter(Boolean) : [],
            category,
            colors,
            sizes,
            stock,
            allowReturn: allowReturn !== undefined ? allowReturn : true,
            allowReplacement: allowReplacement !== undefined ? allowReplacement : true,
            isNew: typeof isNew === 'string' ? isNew.toLowerCase() === 'true' : Boolean(isNew),
            isFeaturedOnHome: typeof isFeaturedOnHome === 'string' ? isFeaturedOnHome.toLowerCase() === 'true' : Boolean(isFeaturedOnHome),
            isKidsProduct: isKidsProductBool,
            kidsType: isKidsProductBool ? kidsType : null,
            showSameColorButton: typeof showSameColorButton === 'string' ? showSameColorButton.toLowerCase() === 'true' : Boolean(showSameColorButton)
        });

        await product.save();
        res.status(201).json({ message: 'Product added successfully', product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update product (Admin and Coadmin)


// Delete product (Admin and authorized Coadmin)
router.delete('/:id', permissionAuth(PERMISSIONS.MANAGE_PRODUCTS), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
