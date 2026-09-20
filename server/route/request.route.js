const express = require('express');
const router = express.Router();
const {
    sendRequest,
    respondRequest,
    getPendingRequests
} = require('../controller/request.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/send', protect, sendRequest);
router.post('/respond', protect, respondRequest);
router.get('/pending', protect, getPendingRequests);

module.exports = router;
