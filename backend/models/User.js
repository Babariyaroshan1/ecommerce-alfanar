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
    username: {
        type: String,
        default: null
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
        mapLink: String,
        country: { type: String, default: 'Kuwait' }
    },
    addresses: [
        {
            _id: mongoose.Schema.Types.ObjectId,
            label: { type: String, required: true }, // e.g., "Home", "Office", "Parents Place"
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
            mapLink: String,
            country: { type: String, default: 'Kuwait' },
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
    // Don't hash if already hashed (bcrypt hashes start with $2)
    if (this.password.startsWith('$2')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Password comparison
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
