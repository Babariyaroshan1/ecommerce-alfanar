import express from 'express';
import settingsController from '../controllers/settingsController.js';
import { adminAuth, permissionAuth } from '../middleware/auth.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = express.Router();

// Get all settings
router.get('/', settingsController.getSettings);

// Update currency (admin/coadmin with permission)
router.put('/currency', permissionAuth(PERMISSIONS.MANAGE_CURRENCY), settingsController.updateCurrency);

// Update shipping price (admin/coadmin with permission)
router.put('/shipping', permissionAuth(PERMISSIONS.MANAGE_CURRENCY), settingsController.updateShipping);

// Update homepage banner image (admin/coadmin with permission)
router.put('/banner', permissionAuth(PERMISSIONS.MANAGE_BANNER), settingsController.updateHomepageBanner);

// Update navbar currency visibility (admin/coadmin with permission)
router.put('/navbar-option', permissionAuth(PERMISSIONS.MANAGE_CURRENCY), settingsController.updateNavbarCurrencyVisibility);
router.put('/show-kwd-navbar', permissionAuth(PERMISSIONS.MANAGE_CURRENCY), settingsController.updateNavbarCurrencyVisibility);
router.put('/new-arrivals-navbar', permissionAuth(PERMISSIONS.MANAGE_CONTENT), settingsController.updateNewArrivalsNavbarVisibility);

// Get co-admins
router.get('/coadmins', adminAuth, settingsController.getCoadmins);

// Update co-admin permissions
router.put('/coadmin-permissions', adminAuth, settingsController.updateCoadminPermissions);

// Get available permissions
router.get('/permissions', adminAuth, settingsController.getAvailablePermissions);

export default router;