const express = require('express');
const router = express.Router();
const {
    getMessages,
    sendMessage,
    markAsRead
} = require('../controller/message.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/:userId', protect, getMessages);
router.post('/send', protect, sendMessage);
router.put('/read/:userId', protect, markAsRead);

module.exports = router;
