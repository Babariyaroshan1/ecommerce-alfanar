import mongoose from 'mongoose';

const creditTransactionSchema = new mongoose.Schema({
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
    amount: {
        type: Number,
        required: true
    },
    source: {
        type: String,
        default: 'admin'
    },
    note: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('CreditTransaction', creditTransactionSchema);
