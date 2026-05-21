import express from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get reviews for a product
router.get('/product/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Invalid product id' });
        }

        const reviews = await Review.find({ productId: req.params.id, approved: true })
            .sort({ createdAt: -1 })
            .lean();

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Submit a review for a product
router.post('/product/:id', auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Invalid product id' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const { rating, comment, images, userName, userEmail } = req.body;
        const parsedRating = Number(rating) || 0;

        if (parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const review = new Review({
            userId: req.userId,
            userName: userName || 'Customer',
            userEmail: userEmail || '',
            productId: req.params.id,
            rating: parsedRating,
            comment: (comment || '').trim(),
            images: Array.isArray(images) ? images.filter(Boolean) : (images ? [images] : []),
            approved: true
        });

        await review.save();

        const reviewStats = await Review.find({ productId: req.params.id, approved: true }).lean();
        const avgRating = reviewStats.length
            ? reviewStats.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviewStats.length
            : product.rating || 0;

        product.rating = Number(avgRating.toFixed(1));
        await product.save();

        res.status(201).json({ message: 'Review submitted successfully', review });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: get all reviews
router.get('/admin/all', adminAuth, async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('productId', 'name')
            .sort({ createdAt: -1 })
            .lean();
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: update a review
router.put('/:id', adminAuth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Invalid review id' });
        }

        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const { rating, comment, approved } = req.body;
        if (rating !== undefined) {
            const parsedRating = Number(rating);
            if (parsedRating < 1 || parsedRating > 5) {
                return res.status(400).json({ message: 'Rating must be between 1 and 5' });
            }
            review.rating = parsedRating;
        }

        if (comment !== undefined) {
            review.comment = String(comment).trim();
        }

        if (approved !== undefined) {
            review.approved = Boolean(approved);
        }

        await review.save();

        const product = await Product.findById(review.productId);
        if (product) {
            const reviewStats = await Review.find({ productId: product._id, approved: true }).lean();
            const avgRating = reviewStats.length
                ? reviewStats.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviewStats.length
                : product.rating || 0;
            product.rating = Number(avgRating.toFixed(1));
            await product.save();
        }

        res.json({ message: 'Review updated successfully', review });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: delete a review
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Invalid review id' });
        }

        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        await Review.findByIdAndDelete(req.params.id);
        const product = await Product.findById(review.productId);
        if (product) {
            const reviewStats = await Review.find({ productId: product._id, approved: true }).lean();
            const avgRating = reviewStats.length
                ? reviewStats.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviewStats.length
                : product.rating || 0;
            product.rating = Number(avgRating.toFixed(1));
            await product.save();
        }

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
