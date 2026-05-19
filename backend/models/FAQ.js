import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        required: true,
        trim: true
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for sorting
faqSchema.index({ sortOrder: 1, createdAt: -1 });

const FAQ = mongoose.model('FAQ', faqSchema);

export default FAQ;