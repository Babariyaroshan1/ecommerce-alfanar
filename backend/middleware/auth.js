import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id || decoded.userId;
        req.user = { id: req.userId };
        req.role = decoded.role || 'user';
        req.isAdmin = decoded.isAdmin || req.role === 'admin';
        req.isCoadmin = req.role === 'coadmin';
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

export const adminAuth = (req, res, next) => {
    auth(req, res, () => {
        if (!req.isAdmin) {
            return res.status(403).json({ message: 'Admin access only' });
        }
        next();
    });
};

export const adminOrCoadminAuth = (req, res, next) => {
    auth(req, res, () => {
        if (!req.isAdmin && !req.isCoadmin) {
            return res.status(403).json({ message: 'Admin or coadmin access only' });
        }
        next();
    });
};

export const permissionAuth = (requiredPermission) => {
    return (req, res, next) => {
        auth(req, res, async () => {
            if (req.isAdmin) {
                // Admin has all permissions
                return next();
            }

            if (req.isCoadmin) {
                try {
                    const { default: User } = await import('../models/User.js');
                    const user = await User.findById(req.userId);
                    if (user && user.permissions && Array.isArray(user.permissions)) {
                        if (user.permissions.includes(requiredPermission)) {
                            return next();
                        }
                    }
                    return res.status(403).json({
                        message: `Permission denied: ${requiredPermission} not assigned to co-admin`
                    });
                } catch (error) {
                    console.error('Permission check error:', error);
                    return res.status(500).json({ message: 'Error checking permissions' });
                }
            }

            return res.status(403).json({ message: 'Insufficient permissions' });
        });
    };
};
