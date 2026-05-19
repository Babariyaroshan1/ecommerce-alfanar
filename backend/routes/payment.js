import express from 'express';
// import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import { auth } from '../middleware/auth.js';
// import crypto from 'crypto';

const router = express.Router();

// Initialize Razorpay only if keys are provided and not placeholder values
// let razorpay = null;
// if (process.env.RAZORPAY_KEY_ID &&
//     process.env.RAZORPAY_KEY_SECRET &&
//     process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key' &&
//     process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_secret') {
//     razorpay = new Razorpay({
//         key_id: process.env.RAZORPAY_KEY_ID,
//         key_secret: process.env.RAZORPAY_KEY_SECRET
//     });
// }
// Create payment order
// router.post('/create-order', auth, async (req, res) => {
//     try {
//         if (!razorpay) {
//             return res.status(500).json({ message: 'Payment gateway not configured' });
//         }

//         const { orderId, amount } = req.body;

//         const options = {
//             amount: amount * 100,
//             currency: 'INR',
//             receipt: orderId,
//             payment_capture: 1
//         };

//         const order = await razorpay.orders.create(options);
//         res.json(order);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// Verify payment
// router.post('/verify', auth, async (req, res) => {
//     try {
//         if (!razorpay) {
//             return res.status(500).json({ message: 'Payment gateway not configured' });
//         }

//         const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

//         const body = razorpay_order_id + '|' + razorpay_payment_id;
//         const expectedSignature = crypto
//             .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//             .update(body.toString())
//             .digest('hex');

//         if (expectedSignature === razorpay_signature) {
//             await Order.findByIdAndUpdate(
//                 orderId,
//                 {
//                     paymentStatus: 'completed',
//                     paymentId: razorpay_payment_id
//                 }
//             );

//             res.json({ message: 'Payment verified successfully' });
//         } else {
//             res.status(400).json({ message: 'Invalid signature' });
//         }
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// Temporary payment placeholder routes
router.post('/create-order', auth, async (req, res) => {
    res.status(503).json({ message: 'Payment gateway temporarily disabled. Please configure Razorpay credentials.' });
});

router.post('/verify', auth, async (req, res) => {
    res.status(503).json({ message: 'Payment verification temporarily disabled. Please configure Razorpay credentials.' });
});

export default router;  