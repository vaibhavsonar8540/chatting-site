'use client';

import React from 'react';
import Navbar from '../components/Navbar';
import AuthForm from '../components/AuthForm';
import ChatDashboard from '../components/ChatDashboard';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const { user, loading } = useAuth();

    return (
        <div className="app-container">
            {/* Animated background glows */}
            <div className="bg-mesh">
                <div className="glow-orb-1"></div>
                <div className="glow-orb-2"></div>
                <div className="glow-orb-3"></div>
            </div>

            {/* Top Navigation - displayed when user is NOT logged in */}
            {!user && <Navbar />}

            {/* Main Section */}
            <main className={user ? "main-chat-wrapper" : "main-content"}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', paddingTop: '4rem' }}>
                        <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }}></div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Initializing WebSocket connection & chat session...</p>
                    </div>
                ) : user ? (
                    <ChatDashboard />
                ) : (
                    <AuthForm />
                )}
            </main>

            {!user && (
                <footer className="footer">
                    <p>Built with Node.js, Express, WebSockets, MongoDB, Mongoose, bcryptjs, JWT & Next.js</p>
                </footer>
            )}
        </div>
    );
}

