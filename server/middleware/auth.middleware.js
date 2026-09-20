const jwt = require('jsonwebtoken');
const User = require('../model/user.model');

const protect = async (req, res, next) => {
    let token;

    // Check for token in cookies or Authorization header
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route. No token provided.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_2026_secure');
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists.'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Invalid or expired token.'
        });
    }
};

module.exports = { protect };
