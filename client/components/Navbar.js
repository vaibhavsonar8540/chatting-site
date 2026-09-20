'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';

export default function Navbar() {
    const { user, serverStatus, checkServerHealth } = useAuth();

    return (
        <header className="navbar">
            <div className="nav-brand">
                <div className="brand-icon">
                    <ShieldCheck size={22} />
                </div>
                <span>ChatFlow</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className={`status-badge ${serverStatus === 'online' ? 'online' : 'offline'}`}>
                    <span className="status-dot"></span>
                    <span className="status-text">
                        {serverStatus === 'online' ? 'Backend Online' : serverStatus === 'checking' ? 'Checking...' : 'Backend Offline'}
                    </span>
                    <button 
                        onClick={checkServerHealth} 
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                        title="Re-check Server Connection"
                    >
                        <RefreshCw size={12} />
                    </button>
                </div>

                {user && (
                    <div className="navbar-user-chip">
                        <UserCheck size={15} style={{ color: '#10b981' }} />
                        <span className="user-chip-name">{user.username}</span>
                    </div>
                )}
            </div>
        </header>
    );
}

