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

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(url => url.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize Socket.IO
initSocket(server, allowedOrigins);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/messages', messageRoutes);

// Root route (for browser visits & Render pings)
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Chat App Backend is live on Render!' });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Chat server with WebSockets is running cleanly' });
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Chat Server running on port ${PORT}`);
});

