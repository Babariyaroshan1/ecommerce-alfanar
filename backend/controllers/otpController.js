import jwt from 'jsonwebtoken';
import Twilio from 'twilio';
import OTP from '../models/OTP.js';
import User from '../models/User.js';

const createRandomOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioVerifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const twilioClient = twilioAccountSid && twilioAuthToken ? Twilio(twilioAccountSid, twilioAuthToken) : null;

export const sendOtp = async (req, res) => {
    try {
        const { identifier, channel = 'sms' } = req.body;
        if (!identifier) {
            return res.status(400).json({ message: 'Identifier is required' });
        }

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        let otpData = {
            identifier,
            channel,
            expiresAt,
            status: 'pending'
        };

        if (channel === 'sms' && twilioClient && twilioVerifyServiceSid) {
            const verification = await twilioClient.verify.services(twilioVerifyServiceSid).verifications.create({
                to: identifier,
                channel: 'sms'
            });

            otpData.twilioServiceSid = verification.serviceSid;
            otpData.twilioVerificationSid = verification.sid;
            otpData.status = 'pending';
        } else {
            const code = createRandomOtp();
            otpData.code = code;
            otpData.status = 'pending';

            // For local testing only. This is not secure for production.
            console.log(`Generated OTP for ${identifier}: ${code}`);
        }

        const otp = new OTP(otpData);
        await otp.save();

        res.json({
            message: 'OTP generated successfully',
            otpId: otp._id,
            expiresAt,
            usingTwilio: Boolean(twilioClient && twilioVerifyServiceSid)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { identifier, code } = req.body;
        if (!identifier || !code) {
            return res.status(400).json({ message: 'Identifier and code are required' });
        }

        let otp = await OTP.findOne({ identifier, verified: false }).sort({ createdAt: -1 });
        if (!otp) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        if (otp.expiresAt < new Date()) {
            otp.status = 'failed';
            await otp.save();
            return res.status(400).json({ message: 'OTP has expired' });
        }

        if (otp.twilioServiceSid && twilioClient && twilioVerifyServiceSid) {
            const verificationCheck = await twilioClient.verify.services(twilioVerifyServiceSid).verificationChecks.create({
                to: identifier,
                code
            });

            if (verificationCheck.status !== 'approved') {
                otp.status = 'failed';
                await otp.save();
                return res.status(400).json({ message: 'Invalid OTP' });
            }

            otp.status = 'approved';
        } else {
            if (!otp.code || otp.code !== code) {
                otp.status = 'failed';
                await otp.save();
                return res.status(400).json({ message: 'Invalid OTP' });
            }
            otp.status = 'approved';
        }

        otp.verified = true;
        otp.verifiedAt = new Date();
        await otp.save();

        let user = await User.findOne({ $or: [{ email: identifier.toLowerCase() }, { phone: identifier }] });
        let token = null;

        if (user) {
            token = jwt.sign({ id: user._id, isAdmin: user.isAdmin, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
        }

        res.json({
            message: 'OTP verified successfully',
            verified: true,
            token,
            user: user ? {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isAdmin: user.isAdmin
            } : null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
