import CreditBalance from '../models/CreditBalance.js';
import CreditTransaction from '../models/CreditTransaction.js';
import mongoose from 'mongoose';

const getOrCreateBalance = async (type, userId = null) => {
    const query = { type };
    if (userId) query.user = userId;

    let balance = await CreditBalance.findOne(query);
    if (!balance) {
        balance = new CreditBalance({ type, user: userId, balance: 0 });
        await balance.save();
    }
    return balance;
};

export const getCreditBalances = async (req, res) => {
    try {
        const { userId } = req.query;
        const query = {};
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            query.user = userId;
        }

        const balances = await CreditBalance.find(query).lean();
        const result = balances.map((balance) => ({
            type: balance.type,
            balance: balance.balance,
            user: balance.user,
            updatedAt: balance.updatedAt
        }));

        return res.json({ balances: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addCredits = async (req, res) => {
    try {
        const { type, amount, userId, note, source } = req.body;

        if (!type || !amount || Number(amount) <= 0) {
            return res.status(400).json({ message: 'Valid credit type and amount are required' });
        }

        if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }

        const balance = await getOrCreateBalance(type, userId || null);
        balance.balance += Number(amount);
        balance.updatedAt = Date.now();
        await balance.save();

        const transaction = new CreditTransaction({
            user: userId || null,
            type,
            amount: Number(amount),
            source: source || 'admin',
            note: note || `Added ${amount} ${type} credits`
        });
        await transaction.save();

        res.status(201).json({
            message: 'Credits added successfully',
            balance: balance.balance,
            transaction
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getCreditHistory = async (req, res) => {
    try {
        const { userId, type, page = 1, limit = 20 } = req.query;
        const query = {};

        if (userId) {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: 'Invalid userId' });
            }
            query.user = userId;
        }

        if (type) query.type = type;

        const total = await CreditTransaction.countDocuments(query);
        const transactions = await CreditTransaction.find(query)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();

        res.json({
            total,
            page: Number(page),
            limit: Number(limit),
            transactions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
