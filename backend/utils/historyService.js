import ChangeHistory from '../models/ChangeHistory.js';
import User from '../models/User.js';

export const createHistoryLog = async (logData) => {
    try {
        const history = new ChangeHistory(logData);
        return await history.save();
    } catch (error) {
        console.error('Error saving history log:', error);
        return null;
    }
};

export const buildHistoryEntry = async ({ req, entityType, entityId, entityName, actionType, description, metadata = {}, clientInfo = {}, ipAddress = '' }) => {
    // Attempt to derive client info from request headers if frontend didn't provide it
    const headers = req?.headers || {};
    const rawUA = headers['user-agent'] || '';
    const acceptLang = headers['accept-language'] || '';
    const secPlatform = headers['sec-ch-ua-platform'] || '';
    const forwardedFor = (headers['x-forwarded-for'] || '').split(',')[0] || '';

    const historyEntry = {
        entityType,
        entityId,
        entityName,
        actionType,
        description,
        metadata,
        clientInfo: {
            userAgent: clientInfo.userAgent || rawUA,
            platform: clientInfo.platform || secPlatform || '',
            vendor: clientInfo.vendor || '',
            language: clientInfo.language || acceptLang,
            deviceMemory: clientInfo.deviceMemory || '',
            browserName: clientInfo.browserName || '',
            browserVersion: clientInfo.browserVersion || '',
            os: clientInfo.os || ''
        },
        ipAddress: ipAddress || req.ip || forwardedFor || '',
        changedByRole: req.role || 'unknown',
        changedById: req.userId || null,
        changedByName: '',
        changedByEmail: ''
    };

    try {
        const user = await User.findById(req.userId).select('name email');
        if (user) {
            historyEntry.changedByName = user.name || '';
            historyEntry.changedByEmail = user.email || '';
        }
    } catch (err) {
        console.warn('Unable to load user details for history log:', err.message);
    }

    return historyEntry;
};

export const getHistoryList = async ({ filter = {}, limit = 100, skip = 0 }) => {
    return ChangeHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
};
