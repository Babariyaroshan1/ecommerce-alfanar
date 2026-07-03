import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { auth, adminAuth, adminOrCoadminAuth, permissionAuth } from '../middleware/auth.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, address } = req.body;

        let normalizedEmail = email?.toLowerCase?.() || '';
        let user = await User.findOne({ email: normalizedEmail });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({
            name,
            email: normalizedEmail,
            phone,
            password,
            address: address || {}
        });
        await user.save();

        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                addresses: user.addresses,
                profileImage: user.profileImage,
                selectedProfile: user.selectedProfile,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const identifier = String(email || '').trim();

        let user;
        if (identifier.includes('@')) {
            user = await User.findOne({ email: identifier.toLowerCase() });
        } else {
            const digitsOnly = identifier.replace(/\D/g, '');
            const plusNumber = digitsOnly ? `+${digitsOnly}` : identifier;
            user = await User.findOne({
                $or: [
                    { phone: identifier },
                    { phone: digitsOnly },
                    { phone: plusNumber }
                ]
            });
        }

        if (!user) return res.status(400).json({ message: 'User not found' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                addresses: user.addresses,
                profileImage: user.profileImage,
                selectedProfile: user.selectedProfile,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
    try {
        const usernameRaw = String(req.body.username || '').trim();
        const password = String(req.body.password || '').trim();
        const username = usernameRaw.toLowerCase();

        let role = 'admin';
        let adminUser;

        if (username === 'admin') {
            adminUser = await User.findOne({ email: 'admin@noor.com' });
            role = 'admin';
        } else if (username === 'coadmin') {
            adminUser = await User.findOne({ email: 'coadmin@noor.com' });
            role = 'coadmin';
        } else {
            adminUser = await User.findOne({
                isAdmin: true,
                $or: [
                    { username: usernameRaw },
                    { username: username },
                    { email: username }
                ]
            });

            if (!adminUser) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }
            role = adminUser.role || 'admin';
        }

        if (!adminUser) {
            const adminEmail = role === 'admin' ? 'admin@noor.com' : 'coadmin@noor.com';
            const adminName = role === 'admin' ? 'Admin' : 'Co-Admin';
            const defaultPassword = role === 'admin' ? 'admin123' : 'coadmin123';
            const defaultUsername = role === 'admin' ? 'admin' : 'coadmin';

            adminUser = new User({
                name: adminName,
                email: adminEmail,
                phone: '0000000000',
                password: await bcrypt.hash(defaultPassword, 10),
                username: defaultUsername,
                role,
                isAdmin: role === 'admin'
            });
            await adminUser.save();
        }

        const isPasswordValid = await bcrypt.compare(password, adminUser.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: adminUser._id, role, isAdmin: role === 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            message: 'Admin login successful',
            token,
            user: { id: adminUser._id, name: adminUser.name, email: adminUser.email, role, isAdmin: role === 'admin' }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, phone, address, profileImage, selectedProfile, addresses } = req.body;
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (phone !== undefined) updateFields.phone = phone;
        if (address !== undefined) updateFields.address = address;
        if (profileImage !== undefined) updateFields.profileImage = profileImage;
        if (selectedProfile !== undefined) updateFields.selectedProfile = selectedProfile;
        if (addresses !== undefined) updateFields.addresses = addresses;

        const user = await User.findByIdAndUpdate(
            req.userId,
            updateFields,
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
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

        res.json({
            message: 'Password reset link has been sent to your email. Please check your inbox and click the link to reset your password.',
            resetLink: resetLink // For development/testing purposes
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send reset email', error: error.message });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
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
});

// Admin: Change Coadmin Password (Only admin can change coadmin's password)
router.put('/admin/change-coadmin-password', adminAuth, async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Find coadmin user
        const coadminUser = await User.findOne({ email: 'coadmin@noor.com' });
        if (!coadminUser) {
            return res.status(404).json({ message: 'Coadmin not found' });
        }

        // Update password with bcrypt hash
        coadminUser.password = await bcrypt.hash(newPassword, 10);
        await coadminUser.save();

        res.json({ message: 'Coadmin password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Change Admin Password (Admin changes own password)
router.put('/admin/change-admin-password', adminAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        // Find admin user
        const adminUser = await User.findById(req.userId);
        if (!adminUser) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, adminUser.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Update password
        adminUser.password = await bcrypt.hash(newPassword, 10);
        await adminUser.save();

        res.json({ message: 'Admin password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Change Coadmin Username (Only admin can change coadmin username)
router.put('/admin/change-coadmin-username', adminAuth, async (req, res) => {
    try {
        const { newUsername } = req.body;

        if (!newUsername || newUsername.trim().length < 3) {
            return res.status(400).json({ message: 'Username must be at least 3 characters' });
        }

        // Find coadmin user
        const coadminUser = await User.findOne({ email: 'coadmin@noor.com' });
        if (!coadminUser) {
            return res.status(404).json({ message: 'Coadmin not found' });
        }

        // Update username
        coadminUser.username = newUsername.trim();
        await coadminUser.save();

        res.json({ message: 'Coadmin username changed successfully', username: coadminUser.username });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Create additional admin user
router.post('/admin/create-admin', adminAuth, async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        const normalizedUsername = String(username || '').trim();
        const normalizedName = String(name || '').trim();
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedName || normalizedName.length < 2) {
            return res.status(400).json({ message: 'Name must be at least 2 characters' });
        }

        if (!normalizedUsername || normalizedUsername.length < 3) {
            return res.status(400).json({ message: 'Username must be at least 3 characters' });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
            return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
        }

        if (['admin', 'coadmin'].includes(normalizedUsername.toLowerCase())) {
            return res.status(400).json({ message: 'Username cannot be reserved keywords' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        let adminEmail = normalizedEmail;
        if (!adminEmail) {
            const safeUsername = normalizedUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
            adminEmail = `${safeUsername}@admin.noor.com`;
        }

        const existingUser = await User.findOne({
            $or: [{ username: normalizedUsername }, { email: adminEmail }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name: normalizedName,
            email: adminEmail,
            phone: '0000000000',
            username: normalizedUsername,
            password: hashedPassword,
            role: 'admin',
            isAdmin: true,
            permissions: []
        });

        await user.save();

        res.status(201).json({
            message: 'Admin user created successfully',
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Create additional co-admin user
router.post('/admin/create-coadmin', adminAuth, async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        const normalizedUsername = String(username || '').trim();
        const normalizedName = String(name || '').trim();
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedName || normalizedName.length < 2) {
            return res.status(400).json({ message: 'Name must be at least 2 characters' });
        }

        if (!normalizedUsername || normalizedUsername.length < 3) {
            return res.status(400).json({ message: 'Username must be at least 3 characters' });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
            return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
        }

        if (['admin', 'coadmin'].includes(normalizedUsername.toLowerCase())) {
            return res.status(400).json({ message: 'Username cannot be reserved keywords' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        let coadminEmail = normalizedEmail;
        if (!coadminEmail) {
            const safeUsername = normalizedUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
            coadminEmail = `${safeUsername}@coadmin.noor.com`;
        }

        const existingUser = await User.findOne({
            $or: [{ username: normalizedUsername }, { email: coadminEmail }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name: normalizedName,
            email: coadminEmail,
            phone: '0000000000',
            username: normalizedUsername,
            password: hashedPassword,
            role: 'coadmin',
            isAdmin: false,
            permissions: []
        });

        await user.save();

        res.status(201).json({
            message: 'Co-admin user created successfully',
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Get all users
router.get('/admin/users', permissionAuth(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('-password -resetToken -resetTokenExpiry');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Get user by ID
router.get('/admin/users/:id', permissionAuth(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -resetToken -resetTokenExpiry');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
