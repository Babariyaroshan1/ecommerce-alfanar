import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all addresses for logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('addresses');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ addresses: user.addresses || [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a new address
router.post('/', auth, async (req, res) => {
    try {
        const { label, houseNumber, street, city, state, pincode, country, phone, isDefault } = req.body;

        // Validate required fields
        if (!label || !houseNumber || !street || !city || !pincode || !phone) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Initialize addresses array if it doesn't exist
        if (!user.addresses) {
            user.addresses = [];
        }

        // If this is the first address or marked as default, set it as default
        const newAddress = {
            _id: new mongoose.Types.ObjectId(),
            label,
            houseNumber,
            street,
            city,
            state: state || '',
            pincode,
            country: country || 'India',
            phone,
            isDefault: isDefault || user.addresses.length === 0,
            createdAt: new Date()
        };

        // If new address is default, unset other defaults
        if (newAddress.isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
        }

        user.addresses.push(newAddress);
        await user.save();

        res.status(201).json({
            message: 'Address added successfully',
            address: newAddress
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update an address
router.put('/:addressId', auth, async (req, res) => {
    try {
        const { addressId } = req.params;
        const { label, houseNumber, street, city, state, pincode, country, phone, isDefault } = req.body;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.find(addr => addr._id.toString() === addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Update fields
        if (label !== undefined) address.label = label;
        if (houseNumber !== undefined) address.houseNumber = houseNumber;
        if (street !== undefined) address.street = street;
        if (city !== undefined) address.city = city;
        if (state !== undefined) address.state = state;
        if (pincode !== undefined) address.pincode = pincode;
        if (country !== undefined) address.country = country;
        if (phone !== undefined) address.phone = phone;

        // Handle default address
        if (isDefault && !address.isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
            address.isDefault = true;
        } else if (!isDefault) {
            address.isDefault = false;
        }

        await user.save();

        res.json({
            message: 'Address updated successfully',
            address
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete an address
router.delete('/:addressId', auth, async (req, res) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const initialLength = user.addresses.length;
        user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);

        if (user.addresses.length === initialLength) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // If deleted address was default, set first address as default
        const wasDefault = user.addresses.some(addr => addr.isDefault);
        if (!wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Set default address
router.post('/:addressId/set-default', auth, async (req, res) => {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.find(addr => addr._id.toString() === addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        user.addresses.forEach(addr => {
            addr.isDefault = false;
        });
        address.isDefault = true;

        await user.save();

        res.json({
            message: 'Default address set successfully',
            address
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
