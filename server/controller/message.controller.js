const Message = require('../model/message.model');
const Request = require('../model/request.model');

/**
 * @desc    Get message history between current user and target user
 * @route   GET /api/messages/:userId
 * @access  Private
 */
const getMessages = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { userId } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        }).sort({ createdAt: 1 });

        // Mark incoming messages from target user as read
        await Message.updateMany(
            { sender: userId, receiver: currentUserId, read: false },
            { $set: { read: true } }
        );

        return res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Get messages error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching message history'
        });
    }
};

/**
 * @desc    Send a message (HTTP fallback)
 * @route   POST /api/messages/send
 * @access  Private
 */
const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId, text } = req.body;

        if (!receiverId || !text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'Receiver ID and non-empty text required' });
        }

        // Verify that chat request is accepted between sender and receiver
        const request = await Request.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ],
            status: 'accepted'
        });

        if (!request) {
            return res.status(403).json({
                success: false,
                message: 'Chat request must be accepted by receiver before sending messages'
            });
        }

        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            text: text.trim()
        });

        return res.status(201).json({
            success: true,
            message
        });
    } catch (error) {
        console.error('Send message error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error sending message'
        });
    }
};

/**
 * @desc    Mark messages as read
 * @route   PUT /api/messages/read/:userId
 * @access  Private
 */
const markAsRead = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { userId } = req.params;

        await Message.updateMany(
            { sender: userId, receiver: currentUserId, read: false },
            { $set: { read: true } }
        );

        return res.status(200).json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error marking messages as read' });
    }
};

module.exports = {
    getMessages,
    sendMessage,
    markAsRead
};
