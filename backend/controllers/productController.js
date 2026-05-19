const Product = require('../models/Product');
const mongoose = require('mongoose');
const { getCurrentCurrencySettings, convertPrice } = require('../utils/currency');

const productController = {
    getAllProducts: async (req, res) => {
        try {
            const { page = 1, limit = 10, search, category } = req.query;

            let query = {};
            if (search) {
                query.name = { $regex: search, $options: 'i' };
            }
            if (category) {
                query.category = category;
            }

            const products = await Product.find(query)
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Product.countDocuments(query);

            // Get current currency settings
            const currencySettings = await getCurrentCurrencySettings();

            // Add currency information to products
            const productsWithCurrency = products.map(product => {
                // Use specific price for currency if available, otherwise convert base price
                let displayPrice;
                if (product.prices && product.prices.get(currencySettings.currency)) {
                    displayPrice = product.prices.get(currencySettings.currency);
                } else {
                    const converted = convertPrice(product.price, currencySettings.currency);
                    displayPrice = converted.price;
                }

                return {
                    ...product.toObject({ flattenMaps: true }),
                    displayPrice: displayPrice,
                    currency: currencySettings.currency,
                    currencySymbol: currencySettings.symbol,
                    country: currencySettings.country
                };
            });

            res.json({
                products: productsWithCurrency,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total,
                currencySettings
            });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch products', error: error.message });
        }
    },

    getProductById: async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(404).json({ message: 'Product not found' });
            }

            const product = await Product.findById(req.params.id);

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            // Get current currency settings
            const currencySettings = await getCurrentCurrencySettings();
            const convertedPrice = convertPrice(product.price, currencySettings.currency);

            const productWithCurrency = {
                ...product.toObject({ flattenMaps: true }), // 🔥 UPDATE HERE
                displayPrice: convertedPrice.price,
                currency: currencySettings.currency,
                currencySymbol: currencySettings.symbol,
                country: currencySettings.country
            };

            res.json(productWithCurrency);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch product', error: error.message });
        }
    },

    getProductsByCategory: async (req, res) => {
        try {
            const products = await Product.find({ category: req.params.category });
            res.json(products);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch products', error: error.message });
        }
    }
};

module.exports = productController;
