import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema({
    template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NotificationTemplate',
        default: null
    },
    channel: {
        type: String,
        enum: ['email', 'sms', 'push', 'whatsapp'],
        required: true
    },
    recipient: {
        type: String,
        required: true
    },
    recipientName: {
        type: String,
        default: null
    },
    subject: {
        type: String,
        default: null
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },
    error: {
        type: String,
        default: null
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    sentAt: {
        type: Date,
        default: null
    }
});

export default mongoose.model('NotificationLog', notificationLogSchema);
