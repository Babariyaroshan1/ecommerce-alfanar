import express from 'express';
import productFaqController from '../controllers/productFaqController.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/:productId', productFaqController.getProductFAQs);

// Admin routes
router.get('/:productId/admin', adminAuth, productFaqController.getAllProductFAQs);
router.post('/:productId', adminAuth, productFaqController.createProductFAQ);
router.put('/:id', adminAuth, productFaqController.updateProductFAQ);
router.delete('/:id', adminAuth, productFaqController.deleteProductFAQ);
router.patch('/:id/toggle', adminAuth, productFaqController.toggleProductFAQStatus);

export default router;
