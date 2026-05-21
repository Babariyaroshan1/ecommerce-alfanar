import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 🔥 CLOUDINARY IMPORTS ADDED HERE
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payment.js';
import settingsRoutes from './routes/settings.js';
import faqRoutes from './routes/faqs.js';
import productFaqRoutes from './routes/productFaqs.js';
import couponRoutes from './routes/coupons.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const BACKEND_URL = process.env.API_URL || 'http://localhost:5000';

// Use environment variable list to configure allowed CORS origins for development and production.
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'https://alfanar.store',
        'https://www.alfanar.store'
    ];

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Agar origin ALLOWED_ORIGINS mein hai, YA origin .vercel.app se end hota hai, toh allow karo
        if (!origin || ALLOWED_ORIGINS.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.options('*', cors());
app.use(express.json());

// ==========================================================
// 🔥 CLOUDINARY CONFIGURATION (REPLACED LOCAL DISK STORAGE)
// ==========================================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'alfanar_products', // Cloudinary me is folder me image save hogi
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif']
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});
// ==========================================================


// Static files - serve uploaded images (Rakh liya hai just in case purani images read karni ho)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));


// ==========================================================
// 🔥 UPLOAD ROUTE (UPDATED TO RETURN CLOUDINARY URL)
// ==========================================================
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // req.file.path ab Cloudinary ka direct secure URL dega
        res.json({
            success: true,
            message: 'File uploaded successfully',
            url: req.file.path, // Yeh seedha Cloudinary ka link hai
            filename: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});


// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.log('❌ MongoDB error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/product-faqs', productFaqRoutes);
app.use('/api/coupons', couponRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});