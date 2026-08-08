import express from 'express';
import { getNotifications, getNotificationLogs, sendNotification } from '../controllers/notificationController.js';
import { adminOrCoadminAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', adminOrCoadminAuth, getNotifications);
router.get('/logs', adminOrCoadminAuth, getNotificationLogs);
router.post('/send', adminOrCoadminAuth, sendNotification);

export default router;
