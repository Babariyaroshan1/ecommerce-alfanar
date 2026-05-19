import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: null
    },
    selectedProfile: {
        type: String,
        default: 'avatar1'
    },
    address: {
        houseNumber: String,
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: 'India' }
    },
    addresses: [
        {
            _id: mongoose.Schema.Types.ObjectId,
            label: { type: String, required: true }, // e.g., "Home", "Office", "Parents Place"
            houseNumber: String,
            street: String,
            city: String,
            state: String,
            pincode: String,
            country: { type: String, default: 'India' },
            phone: String,
            isDefault: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    role: {
        type: String,
        enum: ['user', 'admin', 'coadmin'],
        default: 'user'
    },
    permissions: {
        type: [String],
        default: []
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiry: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Password hashing
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Password comparison
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
