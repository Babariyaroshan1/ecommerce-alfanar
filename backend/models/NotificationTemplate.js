import mongoose from 'mongoose';

const notificationTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    channel: {
        type: String,
        enum: ['email', 'sms', 'push', 'whatsapp'],
        required: true
    },
    subject: {
        type: String,
        default: ''
    },
    body: {
        type: String,
        required: true
    },
    variables: {
        type: [String],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

notificationTemplateSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('NotificationTemplate', notificationTemplateSchema);
