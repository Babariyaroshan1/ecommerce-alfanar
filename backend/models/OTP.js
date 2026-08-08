import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required: true,
        trim: true
    },
    channel: {
        type: String,
        enum: ['email', 'sms'],
        default: 'sms'
    },
    code: {
        type: String,
        default: null
    },
    twilioServiceSid: {
        type: String,
        default: null
    },
    twilioVerificationSid: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'failed'],
        default: 'pending'
    },
    expiresAt: {
        type: Date,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

otpSchema.index({ identifier: 1, code: 1 });

otpSchema.index({ identifier: 1, twilioVerificationSid: 1 });

export default mongoose.model('OTP', otpSchema);
