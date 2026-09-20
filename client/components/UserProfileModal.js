'use client';

import React from 'react';
import { 
    X, 
    User, 
    Mail, 
    Calendar, 
    Wifi, 
    WifiOff, 
    UserCheck, 
    Clock, 
    UserPlus, 
    MessageSquare, 
    LogOut,
    Check,
    UserX,
    Shield
} from 'lucide-react';

export default function UserProfileModal({
    targetUser,
    currentUser,
    isOnline,
    onClose,
    onSendRequest,
    onRespondRequest,
    onLogout,
    onStartChat
}) {
    if (!targetUser) return null;

    const isSelf = targetUser._id === currentUser?.id || targetUser._id === currentUser?._id;
    const requestStatus = targetUser.requestStatus || 'none';
    const getFirstLetter = (name) => (name ? name.charAt(0).toUpperCase() : 'U');

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Recently';
        try {
            return new Date(dateStr).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Recently';
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="modal-header">
                    <h3>User Profile</h3>
                    <button className="modal-close-btn" onClick={onClose} title="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Profile Avatar Card */}
                <div className="profile-card">
                    <div className="profile-avatar-wrapper">
                        <div className="profile-avatar">
                            {getFirstLetter(targetUser.username)}
                        </div>
                        <span className={`profile-status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
                    </div>

                    <h2 className="profile-username">{targetUser.username}</h2>
                    <p className="profile-handle">@{targetUser.username?.toLowerCase().replace(/\s+/g, '_')}</p>

                    <div className="profile-status-pill">
                        {isSelf ? (
                            <span className="mini-tag tag-self">
                                <Shield size={12} /> You (Logged In)
                            </span>
                        ) : requestStatus === 'accepted' ? (
                            <span className="mini-tag tag-success">
                                <UserCheck size={12} /> Connected Friend
                            </span>
                        ) : requestStatus === 'pending_sent' ? (
                            <span className="mini-tag tag-pending">
                                <Clock size={12} /> Request Pending
                            </span>
                        ) : requestStatus === 'pending_received' ? (
                            <span className="mini-tag tag-incoming">
                                Incoming Request
                            </span>
                        ) : (
                            <span className="mini-tag tag-neutral">
                                Not Connected
                            </span>
                        )}
                    </div>
                </div>

                {/* Profile Details List */}
                <div className="profile-details">
                    <div className="detail-item">
                        <div className="detail-icon">
                            <User size={16} />
                        </div>
                        <div className="detail-content">
                            <span className="detail-label">Username</span>
                            <span className="detail-value">{targetUser.username}</span>
                        </div>
                    </div>

                    {targetUser.email && (
                        <div className="detail-item">
                            <div className="detail-icon">
                                <Mail size={16} />
                            </div>
                            <div className="detail-content">
                                <span className="detail-label">Email Address</span>
                                <span className="detail-value">{targetUser.email}</span>
                            </div>
                        </div>
                    )}

                    <div className="detail-item">
                        <div className="detail-icon">
                            {isOnline ? <Wifi size={16} style={{ color: '#059669' }} /> : <WifiOff size={16} />}
                        </div>
                        <div className="detail-content">
                            <span className="detail-label">Online Status</span>
                            <span className="detail-value">
                                {isOnline ? (
                                    <span style={{ color: '#059669', fontWeight: 600 }}>Active Online Now</span>
                                ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>Offline</span>
                                )}
                            </span>
                        </div>
                    </div>

                    {targetUser.createdAt && (
                        <div className="detail-item">
                            <div className="detail-icon">
                                <Calendar size={16} />
                            </div>
                            <div className="detail-content">
                                <span className="detail-label">Member Since</span>
                                <span className="detail-value">{formatDate(targetUser.createdAt)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Actions Footer */}
                <div className="profile-actions">
                    {isSelf ? (
                        <button 
                            onClick={() => { onClose(); onLogout(); }} 
                            className="btn-danger-outline"
                        >
                            <LogOut size={16} /> Sign Out Account
                        </button>
                    ) : requestStatus === 'accepted' ? (
                        <button 
                            onClick={() => { onClose(); onStartChat(targetUser); }} 
                            className="btn-primary"
                        >
                            <MessageSquare size={16} /> Open Chat
                        </button>
                    ) : requestStatus === 'pending_received' ? (
                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                            <button 
                                onClick={async () => { await onRespondRequest(targetUser.requestId, 'accept', targetUser._id); onClose(); }} 
                                className="btn-accept"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                <Check size={16} /> Accept Request
                            </button>
                            <button 
                                onClick={async () => { await onRespondRequest(targetUser.requestId, 'reject', targetUser._id); onClose(); }} 
                                className="btn-reject"
                            >
                                <UserX size={16} />
                            </button>
                        </div>
                    ) : requestStatus === 'none' || requestStatus === 'rejected' ? (
                        <button 
                            onClick={async () => { await onSendRequest(targetUser._id); onClose(); }} 
                            className="btn-primary"
                        >
                            <UserPlus size={16} /> Send Chat Request
                        </button>
                    ) : (
                        <button disabled className="btn-secondary" style={{ opacity: 0.7 }}>
                            <Clock size={16} /> Request Sent (Pending)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
