import express from 'express';
import Coupon from '../models/Coupon.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all coupons (admin only)
router.get('/', auth, adminAuth, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create coupon (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
    try {
        const { code, discountType, discountValue, minPurchase, description } = req.body;

        // Check if code already exists
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }

        const coupon = new Coupon({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minPurchase,
            description
        });

        const savedCoupon = await coupon.save();
        res.status(201).json(savedCoupon);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update coupon (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
    try {
        const { code, discountType, discountValue, minPurchase, description, isActive } = req.body;

        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        // Check if new code conflicts with existing (if code changed)
        if (code.toUpperCase() !== coupon.code) {
            const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
            if (existingCoupon) {
                return res.status(400).json({ message: 'Coupon code already exists' });
            }
        }

        coupon.code = code.toUpperCase();
        coupon.discountType = discountType;
        coupon.discountValue = discountValue;
        coupon.minPurchase = minPurchase;
        coupon.description = description;
        coupon.isActive = isActive;

        const updatedCoupon = await coupon.save();
        res.json(updatedCoupon);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete coupon (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        await coupon.deleteOne();
        res.json({ message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Validate coupon for user
router.post('/validate', async (req, res) => {
    try {
        const { code, subtotal } = req.body;

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
        if (!coupon) {
            return res.status(400).json({ message: 'Invalid coupon code' });
        }

        if (subtotal < coupon.minPurchase) {
            return res.status(400).json({ message: `Minimum purchase of ${coupon.minPurchase} required` });
        }

        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (subtotal * coupon.discountValue) / 100;
        } else {
            discount = coupon.discountValue;
        }

        res.json({
            valid: true,
            discount,
            description: coupon.description,
            couponId: coupon._id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;