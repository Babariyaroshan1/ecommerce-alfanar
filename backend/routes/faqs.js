import express from 'express';
import faqController from '../controllers/faqController.js';
import { adminAuth, permissionAuth } from '../middleware/auth.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = express.Router();

// Public routes
router.get('/', faqController.getFAQs);

// Admin/Coadmin routes with permission check
router.get('/admin', adminAuth, faqController.getAllFAQs);
router.post('/', permissionAuth(PERMISSIONS.MANAGE_FAQS), faqController.createFAQ);
router.put('/:id', permissionAuth(PERMISSIONS.MANAGE_FAQS), faqController.updateFAQ);
router.delete('/:id', permissionAuth(PERMISSIONS.MANAGE_FAQS), faqController.deleteFAQ);
router.patch('/:id/toggle', permissionAuth(PERMISSIONS.MANAGE_FAQS), faqController.toggleFAQStatus);

export default router;