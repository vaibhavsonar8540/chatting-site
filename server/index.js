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

const parseAllowedOrigins = (clientUrlEnv) => {
    const defaults = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://chatting-sitee.vercel.app'
    ];
    if (!clientUrlEnv) return defaults;
    
    const items = clientUrlEnv.split(',').map(u => u.trim()).filter(Boolean);
    const origins = new Set(defaults);

    items.forEach(item => {
        origins.add(item);
        origins.add(item.replace(/\/+$/, ''));
        if (!item.startsWith('http://') && !item.startsWith('https://')) {
            origins.add(`https://${item.replace(/\/+$/, '')}`);
            origins.add(`http://${item.replace(/\/+$/, '')}`);
        }
    });

    return Array.from(origins);
};

const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_URL);

const validateCorsOrigin = (allowedList) => (origin, callback) => {
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/+$/, '');

    const isMatch = allowedList.some(item => {
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

    console.warn(`⚠️ CORS blocked request from origin: ${origin}`);
    return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
};

// Middleware
app.use(cors({
    origin: validateCorsOrigin(allowedOrigins),
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

