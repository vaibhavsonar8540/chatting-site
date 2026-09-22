const User = require('../model/user.model');
const Request = require('../model/request.model');
const Message = require('../model/message.model');

/**
 * @desc    Get all registered users with request status and latest message relative to logged-in user
 * @route   GET /api/users
 * @access  Private
 */
const getUsersList = async (req, res) => {
    try {
        const currentUserId = req.user._id ? req.user._id.toString() : req.user.id.toString();

        // Fetch all other users
        const users = await User.find({ _id: { $ne: currentUserId } })
            .select('-password')
            .sort({ username: 1 });

        // Fetch all requests involving current user
        const requests = await Request.find({
            $or: [{ sender: currentUserId }, { receiver: currentUserId }]
        });

        // Map users with connection status & last message
        const usersWithDetails = await Promise.all(
            users.map(async (u) => {
                const userIdStr = u._id.toString();

                // Find request status
                let requestStatus = 'none';
                let requestId = null;

                const reqObj = requests.find(
                    (r) =>
                        (r.sender.toString() === currentUserId && r.receiver.toString() === userIdStr) ||
                        (r.sender.toString() === userIdStr && r.receiver.toString() === currentUserId)
                );

                if (reqObj) {
                    requestId = reqObj._id.toString();
                    if (reqObj.status === 'accepted') {
                        requestStatus = 'accepted';
                    } else if (reqObj.status === 'rejected') {
                        requestStatus = 'rejected';
                    } else if (reqObj.status === 'pending') {
                        if (reqObj.sender.toString() === currentUserId) {
                            requestStatus = 'pending_sent';
                        } else {
                            requestStatus = 'pending_received';
                        }
                    }
                }

                // Get latest message between current user and this user
                const lastMessage = await Message.findOne({
                    $or: [
                        { sender: currentUserId, receiver: u._id },
                        { sender: u._id, receiver: currentUserId }
                    ]
                }).sort({ createdAt: -1 });

                // Get unread message count
                const unreadCount = await Message.countDocuments({
                    sender: u._id,
                    receiver: currentUserId,
                    read: false
                });

                return {
                    _id: u._id.toString(),
                    username: u.username,
                    email: u.email,
                    createdAt: u.createdAt,
                    requestStatus,
                    requestId,
                    lastMessage: lastMessage ? {
                        text: lastMessage.text,
                        sender: lastMessage.sender.toString(),
                        createdAt: lastMessage.createdAt,
                        read: lastMessage.read
                    } : null,
                    unreadCount
                };
            })
        );

        return res.status(200).json({
            success: true,
            users: usersWithDetails
        });
    } catch (error) {
        console.error('Error fetching users list:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error fetching users'
        });
    }
};

/**
 * @desc    Search users by username or email
 * @route   GET /api/users/search?q=query
 * @access  Private
 */
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const currentUserId = req.user._id ? req.user._id.toString() : req.user.id.toString();

        if (!q || !q.trim()) {
            return res.status(200).json({ success: true, users: [] });
        }

        const regex = new RegExp(q.trim(), 'i');
        const users = await User.find({
            _id: { $ne: currentUserId },
            $or: [{ username: regex }, { email: regex }]
        }).select('-password');

        const requests = await Request.find({
            $or: [{ sender: currentUserId }, { receiver: currentUserId }]
        });

        const usersWithDetails = users.map((u) => {
            const userIdStr = u._id.toString();
            let requestStatus = 'none';
            let requestId = null;

            const reqObj = requests.find(
                (r) =>
                    (r.sender.toString() === currentUserId && r.receiver.toString() === userIdStr) ||
                    (r.sender.toString() === userIdStr && r.receiver.toString() === currentUserId)
            );

            if (reqObj) {
                requestId = reqObj._id.toString();
                if (reqObj.status === 'accepted') requestStatus = 'accepted';
                else if (reqObj.status === 'rejected') requestStatus = 'rejected';
                else if (reqObj.status === 'pending') {
                    requestStatus = reqObj.sender.toString() === currentUserId ? 'pending_sent' : 'pending_received';
                }
            }

            return {
                _id: u._id.toString(),
                username: u.username,
                email: u.email,
                createdAt: u.createdAt,
                requestStatus,
                requestId
            };
        });

        return res.status(200).json({
            success: true,
            users: usersWithDetails
        });
    } catch (error) {
        console.error('Search users error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error searching users'
        });
    }
};

module.exports = {
    getUsersList,
    searchUsers
};
