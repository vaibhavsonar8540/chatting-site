const Request = require('../model/request.model');
const User = require('../model/user.model');

/**
 * @desc    Send a chat request to another user
 * @route   POST /api/requests/send
 * @access  Private
 */
const sendRequest = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId } = req.body;

        if (!receiverId) {
            return res.status(400).json({ success: false, message: 'Receiver ID is required' });
        }

        if (senderId === receiverId) {
            return res.status(400).json({ success: false, message: 'You cannot send a chat request to yourself' });
        }

        const receiverExists = await User.findById(receiverId);
        if (!receiverExists) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check existing request in either direction
        let existingRequest = await Request.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });

        if (existingRequest) {
            if (existingRequest.status === 'accepted') {
                return res.status(400).json({ success: false, message: 'Request already accepted. You can chat now!' });
            }
            if (existingRequest.status === 'pending') {
                return res.status(400).json({ success: false, message: 'A chat request is already pending between you two.' });
            }
            // If rejected previously, reset to pending
            existingRequest.sender = senderId;
            existingRequest.receiver = receiverId;
            existingRequest.status = 'pending';
            await existingRequest.save();

            return res.status(200).json({
                success: true,
                message: 'Chat request sent successfully',
                request: existingRequest
            });
        }

        const newRequest = await Request.create({
            sender: senderId,
            receiver: receiverId,
            status: 'pending'
        });

        return res.status(201).json({
            success: true,
            message: 'Chat request sent successfully',
            request: newRequest
        });
    } catch (error) {
        console.error('Send request error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error sending chat request'
        });
    }
};

/**
 * @desc    Accept or Reject a chat request
 * @route   POST /api/requests/respond
 * @access  Private
 */
const respondRequest = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { requestId, targetUserId, action } = req.body;

        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action. Must be accept or reject.' });
        }

        let request;
        if (requestId) {
            request = await Request.findById(requestId);
        } else if (targetUserId) {
            request = await Request.findOne({
                sender: targetUserId,
                receiver: currentUserId,
                status: 'pending'
            });
        }

        if (!request) {
            return res.status(404).json({ success: false, message: 'Pending chat request not found' });
        }

        // Only receiver can respond to pending request
        if (request.receiver.toString() !== currentUserId) {
            return res.status(403).json({ success: false, message: 'Only the request receiver can accept or reject' });
        }

        request.status = action === 'accept' ? 'accepted' : 'rejected';
        await request.save();

        return res.status(200).json({
            success: true,
            message: `Chat request ${action === 'accept' ? 'accepted' : 'rejected'} successfully`,
            request
        });
    } catch (error) {
        console.error('Respond request error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error responding to request'
        });
    }
};

/**
 * @desc    Get incoming pending chat requests
 * @route   GET /api/requests/pending
 * @access  Private
 */
const getPendingRequests = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        const requests = await Request.find({
            receiver: currentUserId,
            status: 'pending'
        })
            .populate('sender', 'username email createdAt')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('Get pending requests error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching pending requests'
        });
    }
};

module.exports = {
    sendRequest,
    respondRequest,
    getPendingRequests
};
