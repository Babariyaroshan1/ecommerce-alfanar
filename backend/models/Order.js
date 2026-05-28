import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        default: () => 'ORD-' + Date.now()
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
        quantity: Number,
        image: String,
        selectedColor: String,
        selectedSize: String,
        allowReturn: {
            type: Boolean,
            default: true
        },
        allowReplacement: {
            type: Boolean,
            default: true
        }
    }],
    returnRequest: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled'],
            default: 'pending'
        },
        requestedAt: Date,
        completedAt: Date,
        paymentMethod: {
            type: String,
            enum: ['online', 'cod']
        },
        refundAmount: Number,
        refundDueDate: Date,
        bankDetails: {
            accountHolder: String,
            accountNumber: String,
            ifsc: String,
            bankName: String
        },
        reason: String,
        proofImages: [String],
        notes: String
    },
    replacementRequest: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled'],
            default: 'pending'
        },
        requestedAt: Date,
        completedAt: Date,
        reason: String,
        proofImages: [String],
        details: String,
        replacementOrderId: mongoose.Schema.Types.ObjectId
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['online', 'cod', 'upi'],
        default: 'cod'
    },
    currency: {
        type: String,
        enum: ['INR', 'KWD'],
        default: 'INR'
    },
    currencySymbol: {
        type: String,
        default: '₹'
    },
    coupon: {
        code: String,
        discount: Number,
        description: String
    },
    upiId: {
        type: String,
        default: null
    },
    paymentId: String,
    replacementFor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    orderStatus: {
        type: String,
        enum: [
            'pending',
            'confirmed',
            'processing',
            'shipped',
            'out-for-delivery',
            'delivered',
            'cancelled',
            'returned',
            'replacement-requested',
            'return-approved',
            'return-processing',
            'replacement-approved',
            'replacement-processing',
            'return-rejected',
            'replacement-rejected',
            'refunded'
        ],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },
    trackingId: String,
    shippingAddress: {
        name: String,
        phone: String,
        addressTitle: String,
        governorate: String,
        area: String,
        block: String,
        street: String,
        houseNumber: String,
        apartment: String,
        floor: String,
        jadda: String,
        latitude: Number,
        longitude: Number,
        mapLink: String
    },
    trackingDetails: [{
        status: String,
        message: String,
        timestamp: { type: Date, default: Date.now }
    }],
    cancelledBy: {
        type: String,
        enum: [null, 'user', 'admin'],
        default: null
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

export default mongoose.model('Order', orderSchema);
