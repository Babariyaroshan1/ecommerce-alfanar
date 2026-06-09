import mongoose from 'mongoose';

const changeHistorySchema = new mongoose.Schema({
    entityType: {
        type: String,
        enum: ['Product', 'Order', 'User', 'Coupon', 'FAQ', 'Settings', 'Other'],
        required: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    entityName: {
        type: String,
        default: ''
    },
    actionType: {
        type: String,
        enum: ['create', 'update', 'delete', 'status-change', 'permission-change', 'refund', 'cancel', 'other'],
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    changedById: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    changedByName: {
        type: String,
        default: ''
    },
    changedByEmail: {
        type: String,
        default: ''
    },
    changedByRole: {
        type: String,
        enum: ['admin', 'coadmin', 'user', 'system', 'unknown'],
        default: 'unknown'
    },
    clientInfo: {
        userAgent: String,
        platform: String,
        vendor: String,
        language: String,
        deviceMemory: String,
        browserName: String,
        browserVersion: String,
        os: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('ChangeHistory', changeHistorySchema);