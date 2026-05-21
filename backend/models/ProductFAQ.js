import mongoose from 'mongoose';

const productFaqSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false
    },
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

// Index for querying FAQs by product and sorting
productFaqSchema.index({ productId: 1, sortOrder: 1, createdAt: -1 });

const ProductFAQ = mongoose.model('ProductFAQ', productFaqSchema);

export default ProductFAQ;
