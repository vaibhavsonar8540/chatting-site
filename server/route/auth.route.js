const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    logoutUser
} = require('../controller/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', registerUser);
router.post('/signup', registerUser); // Alias for signup
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
