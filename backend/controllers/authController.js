const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authController = {
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = new User({
                name,
                email,
                password: hashedPassword
            });

            await user.save();

            const token = jwt.sign(
                { userId: user._id, role: user.role, isAdmin: user.isAdmin },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            res.json({ message: 'User registered successfully', token });
        } catch (error) {
            res.status(500).json({ message: 'Registration failed', error: error.message });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'User not found' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Invalid password' });
            }

            const token = jwt.sign(
                { userId: user._id, role: user.role, isAdmin: user.isAdmin },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            res.json({ message: 'Login successful', token, user });
        } catch (error) {
            res.status(500).json({ message: 'Login failed', error: error.message });
        }
    },

    adminLogin: async (req, res) => {
        try {
            const { username, password } = req.body;

            // Hardcoded admin credentials for simplicity
            if (username !== 'admin' || password !== 'admin123') {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Find or create admin user
            let adminUser = await User.findOne({ email: 'admin@noor.com' });
            if (!adminUser) {
                adminUser = new User({
                    name: 'Admin',
                    email: 'admin@noor.com',
                    phone: '0000000000',
                    password: await bcrypt.hash('admin123', 10),
                    isAdmin: true
                });
                await adminUser.save();
            }

            const token = jwt.sign(
                { userId: adminUser._id, role: 'admin', isAdmin: true },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            res.json({ message: 'Admin login successful', token, user: adminUser });
        } catch (error) {
            res.status(500).json({ message: 'Admin login failed', error: error.message });
        }
    },

    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.userId).select('-password');
            res.json(user);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
        }
    },
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'User not found' });
            }

            // Generate reset token
            const resetToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1h' }
            );

            // Save reset token to user
            user.resetToken = resetToken;
            user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
            await user.save();

            // TODO: Send email with reset link
            // Use FRONTEND_URL from environment variables for production and local development.
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
            console.log(`Password reset link for ${email}: ${resetLink}`);

            res.json({ message: 'Password reset link sent to your email' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to send reset email', error: error.message });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { token, newPassword } = req.body;

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await User.findOne({
                _id: decoded.userId,
                resetToken: token,
                resetTokenExpiry: { $gt: new Date() }
            });

            if (!user) {
                return res.status(400).json({ message: 'Invalid or expired reset token' });
            }

            // Update password
            user.password = await bcrypt.hash(newPassword, 10);
            user.resetToken = null;
            user.resetTokenExpiry = null;
            await user.save();

            res.json({ message: 'Password reset successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to reset password', error: error.message });
        }
    },
    updateProfile: async (req, res) => {
        try {
            const { name, phone, address, city, state, zipCode } = req.body;

            const user = await User.findByIdAndUpdate(
                req.userId,
                { name, phone, address, city, state, zipCode, updatedAt: Date.now() },
                { new: true }
            ).select('-password');

            res.json({ message: 'Profile updated successfully', user });
        } catch (error) {
            res.status(500).json({ message: 'Failed to update profile', error: error.message });
        }
    },

    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;

            const user = await User.findById(req.userId);
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }

            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to change password', error: error.message });
        }
    }
};

module.exports = authController;
