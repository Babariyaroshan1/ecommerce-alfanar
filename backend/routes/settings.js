import express from 'express';
import settingsController from '../controllers/settingsController.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all settings
router.get('/', settingsController.getSettings);

// Update currency (admin only)
router.put('/currency', adminAuth, settingsController.updateCurrency);

// Update shipping price (admin only)
router.put('/shipping', adminAuth, settingsController.updateShipping);
// Update homepage banner image (admin only)
router.put('/banner', adminAuth, settingsController.updateHomepageBanner);
// Update navbar currency visibility (admin only)
router.put('/navbar-option', adminAuth, settingsController.updateNavbarCurrencyVisibility);
router.put('/show-kwd-navbar', adminAuth, settingsController.updateNavbarCurrencyVisibility);
router.put('/new-arrivals-navbar', adminAuth, settingsController.updateNewArrivalsNavbarVisibility);

// Get co-admins
router.get('/coadmins', adminAuth, settingsController.getCoadmins);

// Update co-admin permissions
router.put('/coadmin-permissions', adminAuth, settingsController.updateCoadminPermissions);

// Get available permissions
router.get('/permissions', adminAuth, settingsController.getAvailablePermissions);

export default router;