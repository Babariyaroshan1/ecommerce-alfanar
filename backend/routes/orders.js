import express from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import { auth, adminAuth, adminOrCoadminAuth, permissionAuth } from '../middleware/auth.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = express.Router();

// Create order
router.post('/', auth, async (req, res) => {
    try {
        const { items, totalAmount, shippingAddress, paymentMethod, upiId, currency, currencySymbol, coupon } = req.body;

        console.log('=== Order Creation Request ===');
        console.log('User ID:', req.userId);
        console.log('Items count:', items?.length);
        console.log('Total Amount:', totalAmount, 'Type:', typeof totalAmount);
        console.log('Payment Method:', paymentMethod);
        console.log('Currency:', currency);
        console.log('Currency Symbol:', currencySymbol);
        console.log('Shipping Address:', shippingAddress);

        // Validate required fields
        if (!items || items.length === 0) {
            console.log('Validation failed: No items in order');
            return res.status(400).json({ message: 'No items in order' });
        }
        if (!totalAmount || totalAmount <= 0) {
            console.log('Validation failed: Invalid total amount', totalAmount);
            return res.status(400).json({ message: 'Invalid total amount' });
        }
        if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone) {
            console.log('Validation failed: Incomplete shipping address', shippingAddress);
            return res.status(400).json({ message: 'Incomplete shipping address' });
        }
        if (!paymentMethod || !['online', 'cod', 'upi'].includes(paymentMethod)) {
            console.log('Validation failed: Invalid payment method', paymentMethod);
            return res.status(400).json({ message: 'Invalid payment method' });
        }

        const productIds = items.map(item => item._id || item.id || item.productId).filter(Boolean);
        console.log('Product IDs to fetch:', productIds.length);

        let validatedCoupon = null;
        if (coupon && coupon.code) {
            const couponRecord = await Coupon.findOne({ code: coupon.code.toUpperCase(), isActive: true });
            if (!couponRecord) {
                return res.status(400).json({ message: 'Invalid or inactive coupon code' });
            }

            const itemSubtotal = items.reduce((sum, item) => {
                const price = Number(item.price || 0);
                return sum + price * item.quantity;
            }, 0);

            if (itemSubtotal < couponRecord.minPurchase) {
                return res.status(400).json({ message: `Minimum purchase of ${couponRecord.minPurchase} required for this coupon` });
            }

            let expectedDiscount = 0;
            if (couponRecord.discountType === 'percentage') {
                expectedDiscount = (itemSubtotal * couponRecord.discountValue) / 100;
            } else {
                expectedDiscount = couponRecord.discountValue;
            }

            validatedCoupon = {
                code: couponRecord.code,
                discount: Number(expectedDiscount.toFixed(3)),
                description: couponRecord.description
            };
        }
        const products = await Product.find({ _id: { $in: productIds } });
        console.log('Products found:', products.length);
        const productMap = new Map(products.map((product) => [product._id.toString(), product]));

        const orderItems = items.map(item => {
            const productId = item._id || item.id || item.productId;
            const product = productId ? productMap.get(productId.toString()) : null;
            return {
                productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                selectedColor: item.selectedColor,
                selectedSize: item.selectedSize,
                allowReturn: item.allowReturn !== undefined ? item.allowReturn : product?.allowReturn ?? true,
                allowReplacement: item.allowReplacement !== undefined ? item.allowReplacement : product?.allowReplacement ?? true
            };
        });

        const orderData = {
            userId: req.userId,
            items: orderItems,
            shippingAddress,
            totalAmount,
            paymentMethod: paymentMethod === 'upi' ? 'online' : paymentMethod,
            currency: currency || 'INR',
            currencySymbol: currencySymbol || '₹',
            coupon: validatedCoupon
        };

        // Add UPI ID if using UPI
        if (paymentMethod === 'upi' && upiId) {
            orderData.upiId = upiId;
        }

        console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
        const order = new Order(orderData);
        await order.save();

        console.log('Order created successfully:', order._id);
        res.status(201).json({
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        console.error('Order creation error:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        res.status(500).json({
            message: error.message || 'Failed to create order',
            error: error.name,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get user orders
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.userId.toString() !== req.userId && !req.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all orders (Admin or authorized Co-Admin)
// Temporarily bypass auth for testing
router.get('/admin/all-test', async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Temporarily bypass auth for testing
router.get('/admin/requests-test', async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [
                { 'returnRequest.status': { $in: ['pending', 'approved', 'processing', 'rejected'] } },
                { 'replacementRequest.status': { $in: ['pending', 'approved', 'processing', 'rejected'] } }
            ]
        })
            .populate('userId', 'name email phone')
            .sort({ updatedAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order status (Admin, Co-Admin, or order owner)
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { orderStatus, trackingId, requestType, requestAction, bankDetails, notes, reason, proofImages, cancelRequest } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const isOwner = order.userId.toString() === req.userId;
        const isAdminOrCoadmin = req.isAdmin || req.isCoadmin;

        if (!isOwner && !isAdminOrCoadmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updateData = {
            updatedAt: new Date()
        };
        const unsetFields = {};

        // Handle cancel request (user cancels pending return/replacement)
        if (isOwner && cancelRequest) {
            if (cancelRequest === 'return') {
                if (!order.returnRequest) {
                    return res.status(400).json({ message: 'No active return request to cancel' });
                }
                // Only allow canceling if status is pending or approved (not already completed/rejected)
                if (order.returnRequest.requestedAt && order.returnRequest.status && !['pending', 'approved'].includes(order.returnRequest.status)) {
                    return res.status(400).json({ message: 'Cannot cancel this return request' });
                }
                // Mark as cancelled (don't delete - keep for admin history)
                updateData.returnRequest = {
                    ...order.returnRequest.toObject?.() || order.returnRequest,
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancelledBy: 'user'
                };
                updateData.orderStatus = 'delivered';
            } else if (cancelRequest === 'replacement') {
                if (!order.replacementRequest) {
                    return res.status(400).json({ message: 'No active replacement request to cancel' });
                }
                // Only allow canceling if status is pending or approved (not already completed/rejected)
                if (order.replacementRequest.requestedAt && order.replacementRequest.status && !['pending', 'approved'].includes(order.replacementRequest.status)) {
                    return res.status(400).json({ message: 'Cannot cancel this replacement request' });
                }
                // Mark as cancelled (don't delete - keep for admin history)
                updateData.replacementRequest = {
                    ...order.replacementRequest.toObject?.() || order.replacementRequest,
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancelledBy: 'user'
                };
                updateData.orderStatus = 'delivered';
            } else {
                return res.status(400).json({ message: 'Invalid cancel request type' });
            }
        } else if (isAdminOrCoadmin && requestType && requestAction) {
            if (requestAction === 'delete') {
                if (requestType === 'return') {
                    if (!order.returnRequest) {
                        return res.status(400).json({ message: 'No return request found for this order' });
                    }
                    unsetFields.returnRequest = '';
                } else if (requestType === 'replacement') {
                    if (!order.replacementRequest) {
                        return res.status(400).json({ message: 'No replacement request found for this order' });
                    }
                    unsetFields.replacementRequest = '';
                } else {
                    return res.status(400).json({ message: 'Invalid request type' });
                }
            } else if (requestType === 'return') {
                if (!order.returnRequest?.requestedAt) {
                    return res.status(400).json({ message: 'No return request found for this order' });
                }

                const currentRequest = order.returnRequest.toObject ? order.returnRequest.toObject() : order.returnRequest;
                const baseRequest = {
                    ...currentRequest,
                    notes: notes || currentRequest.notes || 'Return request processed by admin.'
                };

                if (requestAction === 'approve') {
                    if (order.paymentMethod === 'online') {
                        updateData.orderStatus = 'refunded';
                        updateData.paymentStatus = 'paid';
                        updateData.returnRequest = {
                            ...baseRequest,
                            status: 'completed',
                            completedAt: new Date(),
                            notes: notes || 'Online return approved and refund processed automatically to the original payment method.'
                        };
                    } else {
                        updateData.orderStatus = 'return-approved';
                        updateData.returnRequest = {
                            ...baseRequest,
                            status: 'approved',
                            bankDetails: bankDetails || currentRequest.bankDetails,
                            notes: notes || 'COD return approved. Verify bank details before completing the refund.'
                        };
                    }
                } else if (requestAction === 'complete') {
                    if (order.paymentMethod !== 'cod') {
                        return res.status(400).json({ message: 'Complete refund action is only valid for COD returns' });
                    }
                    if (!bankDetails?.accountHolder || !bankDetails?.accountNumber || !bankDetails?.ifsc) {
                        return res.status(400).json({ message: 'Bank details are required to complete COD refund' });
                    }
                    updateData.orderStatus = 'refunded';
                    updateData.paymentStatus = 'paid';
                    updateData.returnRequest = {
                        ...baseRequest,
                        status: 'completed',
                        completedAt: new Date(),
                        bankDetails,
                        notes: notes || 'COD refund completed and transferred to the provided bank account.'
                    };
                } else if (requestAction === 'reject') {
                    updateData.orderStatus = 'return-rejected';
                    updateData.returnRequest = {
                        ...baseRequest,
                        status: 'rejected',
                        notes: notes || 'Return request rejected by admin.'
                    };
                } else {
                    return res.status(400).json({ message: 'Invalid return request action' });
                }
            } else if (requestType === 'replacement') {
                if (!order.replacementRequest?.requestedAt) {
                    return res.status(400).json({ message: 'No replacement request found for this order' });
                }

                const currentRequest = order.replacementRequest.toObject ? order.replacementRequest.toObject() : order.replacementRequest;
                const baseRequest = {
                    ...currentRequest,
                    details: notes || currentRequest.details || 'Replacement request processed by admin.'
                };

                if (requestAction === 'approve') {
                    updateData.orderStatus = 'replacement-approved';
                    updateData.replacementRequest = {
                        ...baseRequest,
                        status: 'approved',
                        details: notes || 'Replacement request approved by admin.'
                    };

                    const replacementOrder = new Order({
                        userId: order.userId,
                        items: order.items,
                        shippingAddress: order.shippingAddress,
                        totalAmount: 0,
                        paymentMethod: order.paymentMethod,
                        paymentStatus: order.paymentStatus === 'paid' ? 'paid' : 'pending',
                        orderStatus: 'replacement-processing',
                        replacementFor: order._id
                    });
                    await replacementOrder.save();
                    updateData.replacementRequest = {
                        ...updateData.replacementRequest,
                        replacementOrderId: replacementOrder._id
                    };
                } else if (requestAction === 'complete') {
                    updateData.orderStatus = 'replacement-completed';
                    updateData.replacementRequest = {
                        ...baseRequest,
                        status: 'completed',
                        completedAt: new Date(),
                        details: notes || 'Replacement completed by admin.'
                    };
                } else if (requestAction === 'reject') {
                    updateData.orderStatus = 'replacement-rejected';
                    updateData.replacementRequest = {
                        ...baseRequest,
                        status: 'rejected',
                        details: notes || 'Replacement request rejected by admin.'
                    };
                } else {
                    return res.status(400).json({ message: 'Invalid replacement request action' });
                }
            } else {
                return res.status(400).json({ message: 'Invalid request type' });
            }
        } else if (!isAdminOrCoadmin) {
            if (orderStatus === 'cancelled') {
                if (!['pending', 'confirmed', 'processing'].includes(order.orderStatus)) {
                    return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
                }
                updateData.orderStatus = 'cancelled';
                updateData.cancelledBy = 'user';
            } else if (orderStatus === 'returned') {
                if (order.orderStatus !== 'delivered') {
                    return res.status(400).json({ message: 'Order must be delivered before it can be returned' });
                }
                if (!order.items.some(item => item.allowReturn !== false)) {
                    return res.status(400).json({ message: 'Return is not available for any item in this order' });
                }
                if (order.returnRequest?.requestedAt && order.returnRequest.status !== 'rejected') {
                    return res.status(400).json({ message: 'A return request is already in progress' });
                }

                const refundDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                updateData.orderStatus = 'returned';
                updateData.returnRequest = {
                    status: 'pending',
                    requestedAt: new Date(),
                    paymentMethod: order.paymentMethod,
                    refundAmount: order.totalAmount,
                    refundDueDate,
                    bankDetails: bankDetails || order.returnRequest?.bankDetails,
                    reason,
                    proofImages,
                    notes: notes || 'Return requested by customer.'
                };
            } else if (orderStatus === 'replacement-requested') {
                if (order.orderStatus !== 'delivered') {
                    return res.status(400).json({ message: 'Order must be delivered before replacement can be requested' });
                }
                if (!order.items.some(item => item.allowReplacement !== false)) {
                    return res.status(400).json({ message: 'Replacement is not available for any item in this order' });
                }
                if (order.replacementRequest?.requestedAt && order.replacementRequest.status !== 'rejected') {
                    return res.status(400).json({ message: 'A replacement request is already in progress' });
                }

                updateData.orderStatus = 'replacement-requested';
                updateData.replacementRequest = {
                    status: 'pending',
                    requestedAt: new Date(),
                    reason,
                    proofImages,
                    details: notes || 'Replacement requested by customer.'
                };
            } else {
                return res.status(400).json({ message: 'Action not allowed' });
            }
        } else {
            if (orderStatus === 'refunded') {
                return res.status(400).json({ message: 'Refunds must be processed through the return request workflow.' });
            }
            if (orderStatus) {
                updateData.orderStatus = orderStatus;
                if (orderStatus === 'cancelled') {
                    updateData.cancelledBy = 'admin';
                }
            }
            if (trackingId) updateData.trackingId = trackingId;
            if (orderStatus === 'delivered' && order.paymentMethod === 'cod') {
                updateData.paymentStatus = 'paid';
            }
        }

        const updatePayload = { ...updateData };
        if (Object.keys(unsetFields).length > 0) {
            updatePayload.$unset = unsetFields;
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { new: true }
        );

        res.json({ message: 'Order status updated', order: updatedOrder });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Get orders for a specific user
router.get('/admin/user/:userId/orders', permissionAuth(PERMISSIONS.MANAGE_ORDERS), async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DEV ONLY: Create test return/replacement requests for demo
router.post('/admin/create-test-requests', async (req, res) => {
    try {
        const orders = await Order.find().limit(3);
        if (orders.length === 0) {
            return res.status(400).json({ message: 'No orders found to create requests' });
        }

        const refundDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Add return request to first order
        if (orders[0]) {
            orders[0].orderStatus = 'returned';
            orders[0].returnRequest = {
                status: 'pending',
                requestedAt: new Date(),
                paymentMethod: orders[0].paymentMethod,
                refundAmount: orders[0].totalAmount,
                refundDueDate,
                reason: 'Product quality issues - defective item received',
                proofImages: [],
                notes: 'Customer reported product defect'
            };
            await orders[0].save();
        }

        // Add replacement request to second order
        if (orders[1]) {
            orders[1].orderStatus = 'replacement-requested';
            orders[1].replacementRequest = {
                status: 'pending',
                requestedAt: new Date(),
                reason: 'Wrong size received - ordered M but got L',
                proofImages: [],
                details: 'Customer requested size replacement'
            };
            await orders[1].save();
        }

        // Add approved return request to third order
        if (orders[2]) {
            orders[2].orderStatus = 'return-approved';
            orders[2].returnRequest = {
                status: 'approved',
                requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                paymentMethod: orders[2].paymentMethod,
                refundAmount: orders[2].totalAmount,
                refundDueDate,
                reason: 'Not as described in listing',
                proofImages: [],
                notes: 'Return approved - bank details verified'
            };
            await orders[2].save();
        }

        res.json({ message: 'Test requests created', count: orders.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all orders (Admin only)
router.get('/admin/all', adminAuth, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Analytics route
router.get('/admin/analytics', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate, currency = 'INR' } = req.query;

        // Parse dates or default to current month
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();

        // Ensure end date includes the full day
        end.setHours(23, 59, 59, 999);

        // Build currency-aware order filter
        const orderFilter = {
            createdAt: { $gte: start, $lte: end }
        };
        if (currency === 'INR') {
            orderFilter.$or = [
                { currency: 'INR' },
                { currency: { $exists: false } }
            ];
        } else {
            orderFilter.currency = currency;
        }

        // Get orders within date range for paid analytics
        const orders = await Order.find({
            ...orderFilter,
            paymentStatus: 'paid'
        }).populate('items.productId');

        const allOrders = await Order.find(orderFilter);

        // Calculate total revenue and orders
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
        const totalOrders = allOrders.length; // All orders placed in the selected range
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calculate total products sold across all orders (including cancelled)
        const totalProductsSold = allOrders.reduce((sum, order) => {
            const orderTotal = (order.items || []).reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
            console.log(`Order ${order._id}: status=${order.orderStatus}, items=${order.items?.length || 0}, totalQuantity=${orderTotal}`);
            return sum + orderTotal;
        }, 0);

        console.log(`Total Products Sold calculation: ${totalProductsSold}, Total Orders: ${allOrders.length}`);

        // Generate daily revenue data
        const dailyRevenue = [];
        const currentDate = new Date(start);
        while (currentDate <= end) {
            const dayStart = new Date(currentDate);
            const dayEnd = new Date(currentDate);
            dayEnd.setHours(23, 59, 59, 999);

            const dayOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= dayStart && orderDate <= dayEnd;
            });

            const dayRevenue = dayOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

            dailyRevenue.push({
                date: currentDate.toISOString().split('T')[0],
                revenue: dayRevenue
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Get order status breakdown and counts
        const successfulOrders = allOrders.filter(o => String(o.orderStatus || '').toLowerCase() === 'delivered').length;
        const cancelledOrders = allOrders.filter(o => String(o.orderStatus || '').toLowerCase() === 'cancelled').length;

        const orderStatusBreakdown = [
            { status: 'delivered', count: successfulOrders },
            { status: 'shipped', count: allOrders.filter(o => String(o.orderStatus || '').toLowerCase() === 'shipped').length },
            { status: 'processing', count: allOrders.filter(o => String(o.orderStatus || '').toLowerCase() === 'processing').length },
            { status: 'pending', count: allOrders.filter(o => String(o.orderStatus || '').toLowerCase() === 'pending').length },
            { status: 'cancelled', count: cancelledOrders }
        ];

        // Get top selling products
        const productSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const productId = item.productId?._id || item.productId;
                const productName = item.name;
                const quantity = item.quantity || 0;
                const revenue = (item.price || 0) * quantity;

                if (!productSales[productId]) {
                    productSales[productId] = {
                        id: productId,
                        name: productName,
                        totalSold: 0,
                        totalRevenue: 0
                    };
                }

                productSales[productId].totalSold += quantity;
                productSales[productId].totalRevenue += revenue;
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 10);

        // Calculate return and replacement orders
        const returnReplacementOrders = allOrders.filter(order => {
            const hasActiveReturn = order.returnRequest && order.returnRequest.status &&
                ['approved', 'processing', 'completed'].includes(order.returnRequest.status);
            const hasActiveReplacement = order.replacementRequest && order.replacementRequest.status &&
                ['approved', 'processing', 'completed'].includes(order.replacementRequest.status);

            if (hasActiveReturn || hasActiveReplacement) {
                console.log(`Return/Replacement Order found: ${order._id}, returnStatus: ${order.returnRequest?.status}, replacementStatus: ${order.replacementRequest?.status}`);
            }

            return hasActiveReturn || hasActiveReplacement;
        }).length;

        console.log(`Return/Replacement Orders count: ${returnReplacementOrders}, Total orders checked: ${allOrders.length}`);

        res.json({
            totalRevenue,
            totalOrders,
            successfulOrders,
            cancelledOrders,
            totalProductsSold,
            returnReplacementOrders,
            averageOrderValue,
            dailyRevenue,
            orderStatusBreakdown,
            topProducts
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
    }
});

export default router;
