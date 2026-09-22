const { Server } = require('socket.io');
const Message = require('./model/message.model');
const Request = require('./model/request.model');

const onlineUsers = new Map(); // userId -> socketId

const initSocket = (server, clientUrl) => {
    const defaults = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://chatting-sitee.vercel.app'
    ];

    const rawList = Array.isArray(clientUrl)
        ? clientUrl
        : (clientUrl ? clientUrl.split(',').map(u => u.trim()).filter(Boolean) : defaults);

    const originsSet = new Set(defaults);
    rawList.forEach(item => {
        originsSet.add(item);
        originsSet.add(item.replace(/\/+$/, ''));
        if (!item.startsWith('http://') && !item.startsWith('https://')) {
            originsSet.add(`https://${item.replace(/\/+$/, '')}`);
            originsSet.add(`http://${item.replace(/\/+$/, '')}`);
        }
    });

    const allowedOrigins = Array.from(originsSet);

    const validateCorsOrigin = (origin, callback) => {
        if (!origin) return callback(null, true);

        const cleanOrigin = origin.replace(/\/+$/, '');

        const isMatch = allowedOrigins.some(item => {
            if (item === '*') return true;
            const cleanItem = item.replace(/\/+$/, '');
            if (cleanOrigin === cleanItem) return true;
            const originHost = cleanOrigin.replace(/^https?:\/\//, '');
            const itemHost = cleanItem.replace(/^https?:\/\//, '');
            return originHost === itemHost;
        }) || cleanOrigin.endsWith('.vercel.app') || cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1');

        if (isMatch) {
            return callback(null, true);
        }

        console.warn(`⚠️ Socket CORS blocked origin: ${origin}`);
        return callback(new Error(`Socket CORS blocked origin: ${origin}`));
    };

    const io = new Server(server, {
        cors: {
            origin: validateCorsOrigin,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`⚡ Socket connected: ${socket.id}`);

        // Register user socket room
        socket.on('register_user', (userId) => {
            if (!userId) return;
            const strUserId = userId.toString();
            socket.userId = strUserId;
            socket.join(`user_${strUserId}`);
            onlineUsers.set(strUserId, socket.id);

            // Broadcast online status to all
            io.emit('user_status_change', {
                userId: strUserId,
                isOnline: true,
                onlineUsers: Array.from(onlineUsers.keys())
            });

            console.log(`👤 User registered to socket room: user_${strUserId}`);
        });

        // Send real-time message
        socket.on('send_message', async (data) => {
            try {
                const { senderId, receiverId, text } = data;

                if (!senderId || !receiverId || !text || !text.trim()) {
                    return socket.emit('error_message', { message: 'Invalid message payload' });
                }

                const sId = senderId.toString();
                const rId = receiverId.toString();

                // Check if connection is accepted
                const request = await Request.findOne({
                    $or: [
                        { sender: sId, receiver: rId },
                        { sender: rId, receiver: sId }
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
                    sender: sId,
                    receiver: rId,
                    text: text.trim()
                });

                const formattedMsg = {
                    _id: newMessage._id.toString(),
                    sender: newMessage.sender.toString(),
                    receiver: newMessage.receiver.toString(),
                    text: newMessage.text,
                    read: newMessage.read,
                    createdAt: newMessage.createdAt
                };

                // Emit to sender and receiver rooms
                io.to(`user_${sId}`).emit('receive_message', formattedMsg);
                io.to(`user_${rId}`).emit('receive_message', formattedMsg);

                // Notify receiver about new unread / latest message
                io.to(`user_${rId}`).emit('new_message_notification', {
                    senderId: sId,
                    message: formattedMsg
                });

            } catch (err) {
                console.error('Socket send_message error:', err);
                socket.emit('error_message', { message: 'Failed to process message' });
            }
        });

        // Send chat request
        socket.on('send_request_event', ({ senderId, receiverId }) => {
            if (!receiverId) return;
            const rId = receiverId.toString();
            const sId = senderId ? senderId.toString() : '';
            io.to(`user_${rId}`).emit('incoming_request', { senderId: sId });
            io.to(`user_${sId}`).emit('request_updated', { receiverId: rId, status: 'pending_sent' });
        });

        // Respond chat request (accept / reject)
        socket.on('respond_request_event', ({ senderId, receiverId, action }) => {
            if (!senderId || !receiverId) return;
            const sId = senderId.toString();
            const rId = receiverId.toString();
            const status = action === 'accept' ? 'accepted' : 'rejected';
            io.to(`user_${sId}`).emit('request_response', { responderId: rId, action, status });
            io.to(`user_${rId}`).emit('request_response', { responderId: sId, action, status });
        });

        // Typing indicators
        socket.on('typing', ({ senderId, receiverId }) => {
            if (!receiverId) return;
            io.to(`user_${receiverId.toString()}`).emit('user_typing', { senderId: senderId ? senderId.toString() : '' });
        });

        socket.on('stop_typing', ({ senderId, receiverId }) => {
            if (!receiverId) return;
            io.to(`user_${receiverId.toString()}`).emit('user_stop_typing', { senderId: senderId ? senderId.toString() : '' });
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
