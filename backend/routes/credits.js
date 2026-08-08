import express from 'express';
import { getCreditBalances, addCredits, getCreditHistory } from '../controllers/creditController.js';
import { adminOrCoadminAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', adminOrCoadminAuth, getCreditBalances);
router.post('/add', adminOrCoadminAuth, addCredits);
router.get('/history', adminOrCoadminAuth, getCreditHistory);

export default router;
