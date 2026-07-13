const Order = require('../models/Order');
const { getCurrentCurrencySettings } = require('../utils/currency');

const orderController = {
    createOrder: async (req, res) => {
        try {
            const { items, shippingAddress, totalAmount, shippingAmount, paymentMethod, currency, currencySymbol } = req.body;
            const settings = await getCurrentCurrencySettings();
            const resolvedCurrency = typeof currency === 'string' && currency.trim() ? currency : settings.currency;
            const resolvedCurrencySymbol = currencySymbol || settings.symbol || '₹';
            const resolvedShippingAmount = resolvedCurrency === 'INR'
                ? Number(settings.shippingPriceINR ?? settings.shippingPrice ?? 5)
                : Number(settings.shippingPriceKWD ?? settings.shippingPrice ?? 5);

            // Map cart items to order items format - ALWAYS save original price, not sale price
            const orderItems = items.map(item => ({
                productId: item._id || item.id,
                name: item.name,
                price: item.originalPrice || item.displayOriginalPrice || item.price,
                quantity: item.quantity,
                image: item.image,
                selectedColor: item.selectedColor,
                selectedSize: item.selectedSize,
                allowReturn: item.allowReturn !== false,
                allowReplacement: item.allowReplacement !== false
            }));

            const order = new Order({
                userId: req.userId,
                items: orderItems,
                shippingAddress,
                totalAmount,
                shippingAmount: resolvedShippingAmount,
                paymentMethod,
                currency: resolvedCurrency,
                currencySymbol: resolvedCurrencySymbol
            });

            await order.save();

            res.status(201).json({ message: 'Order created successfully', order });
        } catch (error) {
            res.status(500).json({ message: 'Failed to create order', error: error.message });
        }
    },

    getUserOrders: async (req, res) => {
        try {
            const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
            res.json(orders);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
        }
    },

    getOrderById: async (req, res) => {
        try {
            const order = await Order.findOne({
                _id: req.params.id,
                userId: req.userId
            });

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            res.json(order);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch order', error: error.message });
        }
    },

    updateOrder: async (req, res) => {
        try {
            const { status } = req.body;

            const order = await Order.findOneAndUpdate(
                { _id: req.params.id, userId: req.userId },
                { status, updatedAt: Date.now() },
                { new: true }
            );

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            res.json({ message: 'Order updated successfully', order });
        } catch (error) {
            res.status(500).json({ message: 'Failed to update order', error: error.message });
        }
    },

    deleteOrder: async (req, res) => {
        try {
            const order = await Order.findOneAndDelete({
                _id: req.params.id,
                userId: req.userId
            });

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            res.json({ message: 'Order deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to delete order', error: error.message });
        }
    },

    getAnalytics: async (req, res) => {
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

            // Get all orders for status breakdown and total counts in selected currency
            const allOrders = await Order.find(orderFilter);

            // Calculate metrics
            const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
            const totalOrders = allOrders.length; // All orders placed
            const successfulOrders = allOrders.filter(o => o.orderStatus === 'delivered').length; // Successful orders
            const cancelledOrders = allOrders.filter(o => o.orderStatus === 'cancelled').length; // Cancelled orders
            const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Calculate total products sold from paid orders
            const totalProductsSold = orders.reduce((sum, order) => {
                return sum + order.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
            }, 0);

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

            // Get order status breakdown
            const orderStatusBreakdown = [
                { status: 'delivered', count: allOrders.filter(o => o.orderStatus === 'delivered').length },
                { status: 'shipped', count: allOrders.filter(o => o.orderStatus === 'shipped').length },
                { status: 'processing', count: allOrders.filter(o => o.orderStatus === 'processing').length },
                { status: 'pending', count: allOrders.filter(o => o.orderStatus === 'pending').length },
                { status: 'cancelled', count: allOrders.filter(o => o.orderStatus === 'cancelled').length }
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

            res.json({
                totalRevenue,
                totalOrders,
                successfulOrders,
                cancelledOrders,
                totalProductsSold,
                averageOrderValue,
                dailyRevenue,
                orderStatusBreakdown,
                topProducts,
                currency
            });

        } catch (error) {
            console.error('Analytics error:', error);
            res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
        }
    }
};

module.exports = orderController;
