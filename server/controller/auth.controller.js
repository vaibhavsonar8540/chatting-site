const User = require('../model/user.model');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_2026_secure', {
        expiresIn: '7d'
    });
};

// Helper function to set cookie option
const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username, email and password'
            });
        }

        // Check if user or email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'Username is already taken'
            });
        }

        // Create new user (password is hashed automatically in pre-save hook)
        const user = await User.create({
            username,
            email,
            password
        });

        // Generate Token
        const token = generateToken(user._id);

        res.cookie('token', token, getCookieOptions());

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Registration Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server Error during registration'
        });
    }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for user by email or username
        const user = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: email }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate Token
        const token = generateToken(user._id);

        res.cookie('token', token, getCookieOptions());

        return res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server Error during login'
        });
    }
};

/**
 * @desc    Get logged in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('GetMe Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logoutUser = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0)
    });

    return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    logoutUser
};
