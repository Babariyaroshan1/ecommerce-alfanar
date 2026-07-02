import express from 'express';
import { adminAuth } from '../middleware/auth.js';
import ChangeHistory from '../models/ChangeHistory.js';
import { getHistoryList } from '../utils/historyService.js';

const router = express.Router();

const HISTORY_PASSWORD = process.env.HISTORY_PASSWORD || '0825';

router.post('/admin', adminAuth, async (req, res) => {
    try {
        const { password, entityType, actionType, page = 1, pageSize = 100 } = req.body;

        if (!password || password !== HISTORY_PASSWORD) {
            return res.status(403).json({ message: 'Invalid history password' });
        }

        const filter = {};
        if (entityType) filter.entityType = entityType;
        if (actionType) filter.actionType = actionType;

        const limit = Number(pageSize) || 100;
        const skip = (Number(page) - 1) * limit;

        const history = await getHistoryList({ filter, limit, skip });
        const totalRecords = await ChangeHistory.countDocuments(filter);
        const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

        res.json({ history, page: Number(page), pageSize: limit, totalRecords, totalPages });
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch history' });
    }
});

export default router;
