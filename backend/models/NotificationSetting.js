import mongoose from 'mongoose';

const notificationSettingSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true
    },
    channel: {
        type: String,
        enum: ['email', 'sms', 'push', 'whatsapp'],
        required: true
    },
    enabled: {
        type: Boolean,
        default: false
    },
    config: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
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

notificationSettingSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('NotificationSetting', notificationSettingSchema);
