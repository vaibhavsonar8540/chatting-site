const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./db/db');
const authRoutes = require('./route/auth.route');
const userRoutes = require('./route/user.route');
const requestRoutes = require('./route/request.route');
const messageRoutes = require('./route/message.route');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize Socket.IO
initSocket(server, process.env.CLIENT_URL || 'http://localhost:3000');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/messages', messageRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Chat server with WebSockets is running cleanly' });
});

// Start Server
server.listen(PORT, () => {
    console.log(`🚀 Chat Server running on port ${PORT}`);
});

