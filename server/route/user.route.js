const express = require('express');
const router = express.Router();
const { getUsersList, searchUsers } = require('../controller/user.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getUsersList);
router.get('/search', protect, searchUsers);

module.exports = router;
