import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/noor-ecommerce';

const createAdminUser = async () => {
    await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    try {
        const name = 'Mehul';
        const email = 'mehul@noor.com';
        const username = 'Mehul';
        const password = 'chaiandchill#2026';

        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            console.log('User already exists:', {
                name: existingUser.name,
                email: existingUser.email,
                username: existingUser.username,
                isAdmin: existingUser.isAdmin,
            });
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            phone: '0000000000',
            username,
            password: hashedPassword,
            role: 'admin',
            isAdmin: true,
        });

        await user.save();
        console.log('Admin user created successfully.');
        console.log('Login username/email:', username, '/', email);
        console.log('Password:', password);
    } catch (error) {
        console.error('Failed to create admin user:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

createAdminUser();