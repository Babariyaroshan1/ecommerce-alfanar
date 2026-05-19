import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    materialAndCare: {
        type: String,
        default: ''
    },
    countryOfOrigin: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        required: true
    },
    prices: {
        type: Map,
        of: Number,
        default: {}
    },
    originalPrice: {
        type: Number,
        default: null
    },
    discount: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        required: true
    },
    images: [{
        type: String
    }],
    category: {
        type: String,
        required: true
    },
    colors: [{
        type: String,
        required: true
    }],
    sizes: [{
        type: String,
        required: true
    }],
    stock: {
        type: Map,
        of: Number,
        default: {}
    },
    totalStock: {
        type: Number,
        default: 0
    },
    allowReturn: {
        type: Boolean,
        default: true
    },
    allowReplacement: {
        type: Boolean,
        default: true
    },
    isNew: {
        type: Boolean,
        default: false
    },
    isFeaturedOnHome: {
        type: Boolean,
        default: false
    },
    showSameColorButton: {
        type: Boolean,
        default: false
    },
    similarProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    rating: {
        type: Number,
        default: 4.5
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Product', productSchema);
