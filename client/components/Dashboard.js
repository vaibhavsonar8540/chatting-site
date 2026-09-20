'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Key, LogOut, CheckCircle, Clock, Database, RefreshCw, Cpu } from 'lucide-react';

export default function Dashboard() {
    const { user, token, logout, fetchUserProfile } = useAuth();
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const firstChar = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

    const testProtectedRoute = async () => {
        setTestLoading(true);
        setTestResult(null);
        try {
            const startTime = performance.now();
            await fetchUserProfile(token);
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);

            setTestResult({
                status: 200,
                message: 'JWT Token verified successfully via Node.js + MongoDB!',
                latency: `${duration}ms`,
                timestamp: new Date().toLocaleTimeString()
            });
        } catch (err) {
            setTestResult({
                status: 500,
                message: 'Failed to verify token: ' + err.message,
                latency: '0ms',
                timestamp: new Date().toLocaleTimeString()
            });
        } finally {
            setTestLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            {/* Header Profile Card */}
            <div className="glass-card dash-header-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div className="user-avatar-large">
                        {firstChar}
                    </div>
                    <div className="user-title-info">
                        <h2>{user?.username}</h2>
                        <div className="user-email-tag">{user?.email}</div>
                    </div>
                </div>

                <button onClick={logout} className="btn-secondary" title="Sign out of your session">
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>

            {/* Profile Statistics Grid */}
            <div className="stats-grid">
                <div className="glass-card stat-card">
                    <div className="stat-icon">
                        <User size={20} />
                    </div>
                    <div>
                        <div className="stat-label">Username</div>
                        <div className="stat-value">{user?.username}</div>
                    </div>
                </div>

                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                        <Mail size={20} />
                    </div>
                    <div>
                        <div className="stat-label">Email Address</div>
                        <div className="stat-value">{user?.email}</div>
                    </div>
                </div>

                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                        <Database size={20} />
                    </div>
                    <div>
                        <div className="stat-label">MongoDB ID</div>
                        <div className="stat-value" style={{ fontSize: '0.85rem' }}>{user?.id}</div>
                    </div>
                </div>

                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <div className="stat-label">Member Since</div>
                        <div className="stat-value">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Just Now'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Protected API Test Action */}
            <div className="glass-card actions-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '10px', color: '#6366f1' }}>
                            <Cpu size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Test Protected Route</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Send request to <code>GET /api/auth/me</code> with Bearer JWT Token</p>
                        </div>
                    </div>

                    <button 
                        onClick={testProtectedRoute} 
                        className="btn-primary" 
                        disabled={testLoading}
                        style={{ width: 'auto', padding: '0.65rem 1.25rem' }}
                    >
                        {testLoading ? (
                            <>
                                <span className="spinner"></span>
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} />
                                <span>Test Verification API</span>
                            </>
                        )}
                    </button>
                </div>

                {testResult && (
                    <div className={`alert-banner ${testResult.status === 200 ? 'success' : 'error'}`} style={{ marginTop: '0.5rem' }}>
                        <CheckCircle size={18} style={{ flexShrink: 0 }} />
                        <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                <span>Status {testResult.status} OK</span>
                                <span>{testResult.latency}</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', marginTop: '2px' }}>{testResult.message}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Token Inspector Card */}
            <div className="glass-card code-card">
                <div className="code-header">
                    <div className="code-title">
                        <Key size={18} style={{ color: '#ec4899' }} />
                        <span>Active Session JWT Token</span>
                    </div>
                    <span className="status-badge online" style={{ fontSize: '0.75rem' }}>
                        <Shield size={12} /> bcrypt & JWT Encrypted
                    </span>
                </div>
                <div className="code-box">
                    {token ? token : 'No Token Found'}
                </div>
            </div>
        </div>
    );
}
