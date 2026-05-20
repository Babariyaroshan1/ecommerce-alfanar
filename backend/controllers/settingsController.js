import Settings from '../models/Settings.js';
import User from '../models/User.js';
import { PERMISSION_METADATA } from '../utils/permissions.js';

const settingsController = {
    // Get all settings
    getSettings: async (req, res) => {
        try {
            const settings = await Settings.find({});
            const settingsMap = {};
            settings.forEach(setting => {
                settingsMap[setting.key] = setting.value;
            });
            res.json(settingsMap);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Update currency setting (admin only)
    updateCurrency: async (req, res) => {
        try {
            const { country, currency, symbol } = req.body;

            if (!country || !currency || !symbol) {
                return res.status(400).json({ message: 'Country, currency, and symbol are required' });
            }

            // Update or create settings
            await Settings.findOneAndUpdate(
                { key: 'country' },
                { value: country, updatedBy: req.userId, updatedAt: new Date() },
                { upsert: true }
            );

            await Settings.findOneAndUpdate(
                { key: 'currency' },
                { value: currency, updatedBy: req.userId, updatedAt: new Date() },
                { upsert: true }
            );

            await Settings.findOneAndUpdate(
                { key: 'currencySymbol' },
                { value: symbol, updatedBy: req.userId, updatedAt: new Date() },
                { upsert: true }
            );

            res.json({ message: 'Currency settings updated successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Update shipping price (admin only)
    updateShipping: async (req, res) => {
        try {
            const { shippingPrice, shippingPriceKWD, shippingPriceINR } = req.body;

            const updates = [];
            if (shippingPriceKWD !== undefined) {
                const parsedKwd = Number(shippingPriceKWD);
                if (isNaN(parsedKwd) || parsedKwd < 0) {
                    return res.status(400).json({ message: 'Valid shippingPriceKWD is required' });
                }
                updates.push(Settings.findOneAndUpdate(
                    { key: 'shippingPriceKWD' },
                    { value: parsedKwd, updatedBy: req.userId, updatedAt: new Date() },
                    { upsert: true }
                ));

                // Maintain backward compatibility for the old shippingPrice key
                updates.push(Settings.findOneAndUpdate(
                    { key: 'shippingPrice' },
                    { value: parsedKwd, updatedBy: req.userId, updatedAt: new Date() },
                    { upsert: true }
                ));
            }

            if (shippingPriceINR !== undefined) {
                const parsedInr = Number(shippingPriceINR);
                if (isNaN(parsedInr) || parsedInr < 0) {
                    return res.status(400).json({ message: 'Valid shippingPriceINR is required' });
                }
                updates.push(Settings.findOneAndUpdate(
                    { key: 'shippingPriceINR' },
                    { value: parsedInr, updatedBy: req.userId, updatedAt: new Date() },
                    { upsert: true }
                ));
            }

            if (updates.length === 0 && shippingPrice !== undefined) {
                const parsedPrice = Number(shippingPrice);
                if (isNaN(parsedPrice) || parsedPrice < 0) {
                    return res.status(400).json({ message: 'Valid shippingPrice is required' });
                }
                updates.push(Settings.findOneAndUpdate(
                    { key: 'shippingPrice' },
                    { value: parsedPrice, updatedBy: req.userId, updatedAt: new Date() },
                    { upsert: true }
                ));
            }

            if (updates.length === 0) {
                return res.status(400).json({ message: 'No shipping price provided' });
            }

            await Promise.all(updates);
            res.json({ message: 'Shipping settings updated successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Update navbar currency visibility (admin only)
    updateNavbarCurrencyVisibility: async (req, res) => {
        try {
            let { showKwdNavbarOption } = req.body;

            if (typeof showKwdNavbarOption === 'string') {
                showKwdNavbarOption = showKwdNavbarOption.toLowerCase() === 'true';
            }

            if (typeof showKwdNavbarOption !== 'boolean') {
                return res.status(400).json({ message: 'showKwdNavbarOption must be a boolean' });
            }

            await Settings.findOneAndUpdate(
                { key: 'showKwdNavbarOption' },
                { value: showKwdNavbarOption, updatedBy: req.userId, updatedAt: new Date() },
                { upsert: true }
            );

            res.json({ message: 'Navbar currency visibility updated successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Update New Arrivals navbar link visibility (admin only)
    updateNewArrivalsNavbarVisibility: async (req, res) => {
        try {
            let { showNewArrivalsNavbar } = req.body;

            if (typeof showNewArrivalsNavbar === 'string') {
                showNewArrivalsNavbar = showNewArrivalsNavbar.toLowerCase() === 'true';
            }

            if (typeof showNewArrivalsNavbar !== 'boolean') {
                return res.status(400).json({ message: 'showNewArrivalsNavbar must be a boolean' });
            }

            await Settings.findOneAndUpdate(
                { key: 'showNewArrivalsNavbar' },
                { value: showNewArrivalsNavbar, updatedBy: req.userId, updatedAt: new Date() },
                { upsert: true }
            );

            res.json({ message: 'New Arrivals navbar visibility updated successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Update homepage banner image (admin only)
    updateHomepageBanner: async (req, res) => {
        try {
            const { bannerImageUrl } = req.body;

            if (!bannerImageUrl || typeof bannerImageUrl !== 'string') {
                return res.status(400).json({ message: 'bannerImageUrl is required and must be a string' });
            }

            await Settings.findOneAndUpdate(
                { key: 'homeBannerImageUrl' },
                { value: bannerImageUrl, updatedBy: req.userId, updatedAt: new Date() },
                { upsert: true }
            );

            res.json({ message: 'Homepage banner updated successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get all co-admins
    getCoadmins: async (req, res) => {
        try {
            const coadmins = await User.find({ role: 'coadmin' }).select('-password');
            res.json(coadmins);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Update co-admin permissions
    updateCoadminPermissions: async (req, res) => {
        try {
            const { coadminId, permissions } = req.body;

            if (!coadminId || !Array.isArray(permissions)) {
                return res.status(400).json({ message: 'Coadmin ID and permissions array are required' });
            }

            const coadmin = await User.findById(coadminId);
            if (!coadmin || coadmin.role !== 'coadmin') {
                return res.status(404).json({ message: 'Co-admin not found' });
            }

            coadmin.permissions = permissions;
            await coadmin.save();

            res.json({ message: 'Permissions updated successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get available permissions
    getAvailablePermissions: async (req, res) => {
        try {
            res.json(PERMISSION_METADATA);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default settingsController;