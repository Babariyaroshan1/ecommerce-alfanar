import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { PERMISSIONS } from '../utils/permissions.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/noor-ecommerce';

const grantCoadmin = async () => {
    await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    try {
        const email = 'mehul@noor.com';

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.error('User with email', email, 'not found. Create the user first.');
            process.exit(1);
        }

        user.role = 'coadmin';
        user.isAdmin = false;
        user.permissions = [PERMISSIONS.MANAGE_PRODUCTS, PERMISSIONS.MANAGE_ORDERS];

        await user.save();

        console.log(`Updated user ${user.email} to role 'coadmin' with permissions:`, user.permissions);
    } catch (err) {
        console.error('Error updating coadmin:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

grantCoadmin();
