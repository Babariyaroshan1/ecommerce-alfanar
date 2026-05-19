import express from 'express';
import faqController from '../controllers/faqController.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', faqController.getFAQs);

// Admin routes
router.get('/admin', adminAuth, faqController.getAllFAQs);
router.post('/', adminAuth, faqController.createFAQ);
router.put('/:id', adminAuth, faqController.updateFAQ);
router.delete('/:id', adminAuth, faqController.deleteFAQ);
router.patch('/:id/toggle', adminAuth, faqController.toggleFAQStatus);

export default router;