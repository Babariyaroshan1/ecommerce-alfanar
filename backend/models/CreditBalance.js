import mongoose from 'mongoose';

const creditBalanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    type: {
        type: String,
        enum: ['email', 'sms', 'push', 'whatsapp', 'general'],
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

creditBalanceSchema.index({ user: 1, type: 1 }, { unique: true, sparse: true });

export default mongoose.model('CreditBalance', creditBalanceSchema);
