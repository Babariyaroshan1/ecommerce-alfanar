import express from 'express';
import productFaqController from '../controllers/productFaqController.js';
import { adminAuth, permissionAuth } from '../middleware/auth.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = express.Router();

// Public routes
router.get('/', productFaqController.getProductFAQs);
router.get('/admin', adminAuth, productFaqController.getAllProductFAQs);
router.get('/:productId', productFaqController.getProductFAQs);

// Admin/Coadmin routes with permission check
router.post('/', permissionAuth(PERMISSIONS.MANAGE_PRODUCT_FAQS), productFaqController.createProductFAQ);
router.post('/:productId', permissionAuth(PERMISSIONS.MANAGE_PRODUCT_FAQS), productFaqController.createProductFAQ);
router.put('/:id', permissionAuth(PERMISSIONS.MANAGE_PRODUCT_FAQS), productFaqController.updateProductFAQ);
router.delete('/:id', permissionAuth(PERMISSIONS.MANAGE_PRODUCT_FAQS), productFaqController.deleteProductFAQ);
router.patch('/:id/toggle', permissionAuth(PERMISSIONS.MANAGE_PRODUCT_FAQS), productFaqController.toggleProductFAQStatus);

export default router;
