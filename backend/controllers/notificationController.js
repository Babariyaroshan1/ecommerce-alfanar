import NotificationTemplate from '../models/NotificationTemplate.js';
import NotificationLog from '../models/NotificationLog.js';
import NotificationSetting from '../models/NotificationSetting.js';
import mongoose from 'mongoose';

const buildMessageFromTemplate = (template, payload) => {
    if (!template) return null;
    let message = template.body;
    Object.entries(payload || {}).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{\s*${key}\s*}}`, 'gi');
        message = message.replace(placeholder, String(value));
    });
    return message;
};

export const getNotifications = async (req, res) => {
    try {
        const templates = await NotificationTemplate.find({}).lean();
        const settings = await NotificationSetting.find({}).lean();

        res.json({ templates, settings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getNotificationLogs = async (req, res) => {
    try {
        const { channel, status, page = 1, limit = 20 } = req.query;
        const query = {};

        if (channel) query.channel = channel;
        if (status) query.status = status;

        const total = await NotificationLog.countDocuments(query);
        const logs = await NotificationLog.find(query)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();

        res.json({ total, page: Number(page), limit: Number(limit), logs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const sendNotification = async (req, res) => {
    try {
        const { channel, recipient, recipientName, subject, message, templateId, payload = {} } = req.body;

        if (!channel || !recipient) {
            return res.status(400).json({ message: 'Channel and recipient are required' });
        }

        let template = null;
        let finalMessage = message;
        let finalSubject = subject;

        if (templateId) {
            if (!mongoose.Types.ObjectId.isValid(templateId)) {
                return res.status(400).json({ message: 'Invalid templateId' });
            }
            template = await NotificationTemplate.findById(templateId);
            if (!template) {
                return res.status(404).json({ message: 'Notification template not found' });
            }
            finalMessage = buildMessageFromTemplate(template, payload);
            if (!subject) finalSubject = template.subject;
        }

        const logEntry = new NotificationLog({
            template: template ? template._id : null,
            channel,
            recipient,
            recipientName: recipientName || null,
            subject: finalSubject || null,
            message: finalMessage || '',
            payload,
            status: 'pending'
        });
        await logEntry.save();

        // Mock send behavior: actual provider integration can be added later
        const now = Date.now();
        logEntry.status = 'sent';
        logEntry.sentAt = now;
        await logEntry.save();

        res.status(201).json({
            message: 'Notification sent successfully (mock)',
            notification: logEntry
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
