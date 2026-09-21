const { Server } = require('socket.io');
const Message = require('./model/message.model');
const Request = require('./model/request.model');

const onlineUsers = new Map(); // userId -> socketId

const initSocket = (server, clientUrl) => {
    const origins = Array.isArray(clientUrl)
        ? clientUrl
        : (clientUrl ? clientUrl.split(',').map(u => u.trim()) : ['http://localhost:3000']);

    const io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || origins.includes(origin) || origins.includes('*')) {
                    return callback(null, true);
                }
                return callback(new Error('Not allowed by CORS'));
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`⚡ Socket connected: ${socket.id}`);

        // Register user socket room
        socket.on('register_user', (userId) => {
            if (!userId) return;
            socket.userId = userId;
            socket.join(`user_${userId}`);
            onlineUsers.set(userId, socket.id);

            // Broadcast online status to all
            io.emit('user_status_change', {
                userId,
                isOnline: true,
                onlineUsers: Array.from(onlineUsers.keys())
            });

            console.log(`👤 User registered to socket room: user_${userId}`);
        });

        // Send real-time message
        socket.on('send_message', async (data) => {
            try {
                const { senderId, receiverId, text } = data;

                if (!senderId || !receiverId || !text || !text.trim()) {
                    return socket.emit('error_message', { message: 'Invalid message payload' });
                }

                // Check if connection is accepted
                const request = await Request.findOne({
                    $or: [
                        { sender: senderId, receiver: receiverId },
                        { sender: receiverId, receiver: senderId }
                    ],
                    status: 'accepted'
                });

                if (!request) {
                    return socket.emit('error_message', {
                        message: 'Receiver has not accepted your chat request yet!'
                    });
                }

                // Save message to MongoDB
                const newMessage = await Message.create({
                    sender: senderId,
                    receiver: receiverId,
                    text: text.trim()
                });

                const formattedMsg = {
                    _id: newMessage._id,
                    sender: newMessage.sender,
                    receiver: newMessage.receiver,
                    text: newMessage.text,
                    read: newMessage.read,
                    createdAt: newMessage.createdAt
                };

                // Emit to sender and receiver rooms
                io.to(`user_${senderId}`).emit('receive_message', formattedMsg);
                io.to(`user_${receiverId}`).emit('receive_message', formattedMsg);

                // Notify receiver about new unread / latest message
                io.to(`user_${receiverId}`).emit('new_message_notification', {
                    senderId,
                    message: formattedMsg
                });

            } catch (err) {
                console.error('Socket send_message error:', err);
                socket.emit('error_message', { message: 'Failed to process message' });
            }
        });

        // Send chat request
        socket.on('send_request_event', ({ senderId, receiverId }) => {
            io.to(`user_${receiverId}`).emit('incoming_request', { senderId });
            io.to(`user_${senderId}`).emit('request_updated', { receiverId, status: 'pending_sent' });
        });

        // Respond chat request (accept / reject)
        socket.on('respond_request_event', ({ senderId, receiverId, action }) => {
            const status = action === 'accept' ? 'accepted' : 'rejected';
            io.to(`user_${senderId}`).emit('request_response', { responderId: receiverId, action, status });
            io.to(`user_${receiverId}`).emit('request_response', { responderId: senderId, action, status });
        });

        // Typing indicators
        socket.on('typing', ({ senderId, receiverId }) => {
            io.to(`user_${receiverId}`).emit('user_typing', { senderId });
        });

        socket.on('stop_typing', ({ senderId, receiverId }) => {
            io.to(`user_${receiverId}`).emit('user_stop_typing', { senderId });
        });

        // Disconnect
        socket.on('disconnect', () => {
            if (socket.userId) {
                onlineUsers.delete(socket.userId);
                io.emit('user_status_change', {
                    userId: socket.userId,
                    isOnline: false,
                    onlineUsers: Array.from(onlineUsers.keys())
                });
            }
            console.log(`❌ Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getOnlineUsers = () => Array.from(onlineUsers.keys());

module.exports = { initSocket, getOnlineUsers };
