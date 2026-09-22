'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
    Search, 
    MessageSquare, 
    UserCheck, 
    Clock, 
    UserPlus, 
    LogOut, 
    Check, 
    UserX, 
    Wifi, 
    WifiOff,
    Inbox,
    Users,
    User,
    Compass
} from 'lucide-react';

export default function ChatSidebar({
    users,
    activeUser,
    onSelectUser,
    pendingRequests,
    onSendRequest,
    onRespondRequest,
    onLogout,
    onOpenProfile
}) {
    const { user: currentUser } = useAuth();
    const { isConnected, onlineUsers } = useSocket();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'discover' | 'requests'

    // Separate connected friends from other registered users
    const friends = users.filter((u) => u.requestStatus === 'accepted');
    const discoverUsers = users.filter((u) => u.requestStatus !== 'accepted');

    // Filter lists by search query
    const filteredFriends = friends.filter((u) =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDiscoverUsers = discoverUsers.filter((u) =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getFirstLetter = (name) => (name ? name.charAt(0).toUpperCase() : 'U');
    const pendingCount = pendingRequests ? pendingRequests.length : 0;

    return (
        <div className="chat-sidebar">
            {/* Header section with User Info & Socket Status */}
            <div className="sidebar-header">
                <div 
                    className="sidebar-user-profile-trigger"
                    onClick={() => onOpenProfile(currentUser)}
                    title="Click to view your profile"
                >
                    <div className="user-avatar main-avatar">
                        {getFirstLetter(currentUser?.username)}
                    </div>
                    <div>
                        <div className="sidebar-username">{currentUser?.username}</div>
                        <div className="socket-connection-badge">
                            {isConnected ? (
                                <span className="live-tag"><Wifi size={12} /> Live</span>
                            ) : (
                                <span className="offline-tag"><WifiOff size={12} /> Connecting...</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="sidebar-header-actions">
                    <button 
                        onClick={() => onOpenProfile(currentUser)} 
                        className="icon-btn-profile" 
                        title="View My Profile"
                    >
                        <User size={18} />
                    </button>
                    <button onClick={onLogout} className="icon-btn-logout" title="Sign Out">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="sidebar-tabs">
                <button
                    className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chats')}
                    title="Connected Friends"
                >
                    <MessageSquare size={16} />
                    <span>Chats</span>
                    {friends.length > 0 && (
                        <span className="tab-badge-neutral">{friends.length}</span>
                    )}
                </button>

                <button
                    className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
                    onClick={() => setActiveTab('discover')}
                    title="Find Registered Users"
                >
                    <Compass size={16} />
                    <span>Discover</span>
                </button>

                <button
                    className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                    title="Chat Requests"
                >
                    <Inbox size={16} />
                    <span>Requests</span>
                    {pendingCount > 0 && (
                        <span className="tab-badge">{pendingCount}</span>
                    )}
                </button>
            </div>

            {/* Search Input */}
            {(activeTab === 'chats' || activeTab === 'discover') && (
                <div className="sidebar-search">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder={
                            activeTab === 'chats' 
                                ? "Search connected friends..." 
                                : "Search registered users by username/email..."
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="clear-search-btn">×</button>
                    )}
                </div>
            )}

            {/* Conversations & Discover List */}
            <div className="sidebar-user-list">
                {/* 1. CHATS TAB (Connected Friends Only) */}
                {activeTab === 'chats' && (
                    filteredFriends.length === 0 ? (
                        <div className="no-users-found">
                            <Users size={32} style={{ color: 'var(--text-subtle)' }} />
                            {searchQuery ? (
                                <>
                                    <p style={{ fontWeight: 600 }}>No connected friends match "{searchQuery}"</p>
                                    {filteredDiscoverUsers.length > 0 ? (
                                        <div style={{ marginTop: '0.75rem', width: '100%', textAlign: 'center' }}>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginBottom: '0.5rem' }}>
                                                Found {filteredDiscoverUsers.length} registered user(s) in Discover
                                            </p>
                                            <button 
                                                onClick={() => setActiveTab('discover')}
                                                className="btn-primary"
                                                style={{ width: 'auto', padding: '0.45rem 1rem', fontSize: '0.82rem', margin: '0 auto' }}
                                            >
                                                <Compass size={14} /> View Registered Users ({filteredDiscoverUsers.length})
                                            </button>
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
                                            No registered users found matching "{searchQuery}".
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p style={{ fontWeight: 700, color: 'var(--text-main)' }}>No Connected Friends Yet</p>
                                    <p style={{ fontSize: '0.82rem' }}>You must send or accept a chat request before users appear in your Chats list.</p>
                                    <button 
                                        onClick={() => setActiveTab('discover')}
                                        className="btn-primary"
                                        style={{ marginTop: '0.5rem', width: 'auto', padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                                    >
                                        <Compass size={14} /> Find & Connect Users
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        filteredFriends.map((u) => {
                            const uIdStr = String(u._id || u.id);
                            const activeIdStr = activeUser ? String(activeUser._id || activeUser.id) : null;
                            const isSelected = activeIdStr === uIdStr;
                            const isOnline = (onlineUsers || []).map(String).includes(uIdStr);

                            let formattedTime = '';
                            if (u.lastMessage?.createdAt) {
                                const d = new Date(u.lastMessage.createdAt);
                                formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            }

                            return (
                                <div
                                    key={uIdStr}
                                    onClick={() => onSelectUser(u)}
                                    className={`user-item ${isSelected ? 'active' : ''}`}
                                >
                                    <div 
                                        className="user-avatar-container"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenProfile(u);
                                        }}
                                        title="View Profile"
                                    >
                                        <div className="user-avatar">
                                            {getFirstLetter(u.username)}
                                        </div>
                                        <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
                                    </div>

                                    <div className="user-item-info">
                                        <div className="user-item-header">
                                            <span className="user-item-name">{u.username}</span>
                                            {formattedTime && <span className="user-item-time">{formattedTime}</span>}
                                        </div>

                                        <div className="user-item-preview">
                                            {u.lastMessage ? (
                                                <span className="preview-text">
                                                    {String(u.lastMessage.sender) === String(currentUser?.id || currentUser?._id) ? 'You: ' : ''}
                                                    {u.lastMessage.text}
                                                </span>
                                            ) : (
                                                <span className="preview-text muted">No messages yet</span>
                                            )}

                                            {u.unreadCount > 0 && (
                                                <span className="unread-badge">{u.unreadCount}</span>
                                            )}
                                        </div>

                                        <div className="user-item-status-bar">
                                            <span className="mini-tag tag-success">
                                                <UserCheck size={11} /> Friend
                                            </span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenProfile(u);
                                        }}
                                        className="btn-item-profile"
                                        title="View User Profile"
                                    >
                                        <User size={15} />
                                    </button>
                                </div>
                            );
                        })
                    )
                )}

                {/* 2. DISCOVER TAB (Find Registered Users) */}
                {activeTab === 'discover' && (
                    filteredDiscoverUsers.length === 0 ? (
                        <div className="no-users-found">
                            <Compass size={32} style={{ color: 'var(--text-subtle)' }} />
                            <p>{searchQuery ? `No registered user matches "${searchQuery}".` : 'No other registered users found.'}</p>
                        </div>
                    ) : (
                        filteredDiscoverUsers.map((u) => {
                            const uIdStr = String(u._id || u.id);
                            const isOnline = (onlineUsers || []).map(String).includes(uIdStr);
                            const requestStatus = u.requestStatus || 'none';

                            return (
                                <div 
                                    key={uIdStr} 
                                    className="user-item discover-user-item"
                                    onClick={() => onSelectUser(u)}
                                >
                                    <div 
                                        className="user-avatar-container"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenProfile(u);
                                        }}
                                        title="View Profile"
                                    >
                                        <div className="user-avatar">
                                            {getFirstLetter(u.username)}
                                        </div>
                                        <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
                                    </div>

                                    <div className="user-item-info">
                                        <div className="user-item-header">
                                            <span className="user-item-name">{u.username}</span>
                                        </div>

                                        <div className="user-item-preview">
                                            <span className="preview-text muted">{u.email}</span>
                                        </div>

                                        <div className="user-item-status-bar" style={{ marginTop: '0.25rem' }}>
                                            {requestStatus === 'pending_sent' && (
                                                <span className="mini-tag tag-pending">
                                                    <Clock size={11} /> Request Pending
                                                </span>
                                            )}
                                            {requestStatus === 'pending_received' && (
                                                <span className="mini-tag tag-incoming">
                                                    Incoming Request
                                                </span>
                                            )}
                                            {requestStatus === 'none' && (
                                                <span className="mini-tag tag-neutral">
                                                    Not Connected
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action button inside list */}
                                    <div className="discover-actions" onClick={(e) => e.stopPropagation()}>
                                        {requestStatus === 'none' || requestStatus === 'rejected' ? (
                                            <button 
                                                onClick={() => onSendRequest(u._id)} 
                                                className="btn-send-req-mini"
                                                title="Send Chat Request"
                                            >
                                                <UserPlus size={14} /> Add
                                            </button>
                                        ) : requestStatus === 'pending_received' ? (
                                            <button 
                                                onClick={() => onRespondRequest(u.requestId, 'accept', u._id)} 
                                                className="btn-accept-mini"
                                                title="Accept Request"
                                            >
                                                <Check size={14} />
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => onOpenProfile(u)} 
                                                className="btn-item-profile"
                                                title="View Profile"
                                            >
                                                <User size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )
                )}

                {/* 3. REQUESTS TAB (Pending Incoming Requests) */}
                {activeTab === 'requests' && (
                    pendingRequests.length === 0 ? (
                        <div className="no-users-found">
                            <Inbox size={32} style={{ color: 'var(--text-subtle)' }} />
                            <p>No pending chat requests.</p>
                        </div>
                    ) : (
                        pendingRequests.map((req) => {
                            const sender = req.sender;
                            return (
                                <div key={req._id} className="pending-request-card">
                                    <div 
                                        className="request-card-info"
                                        onClick={() => onOpenProfile(sender)}
                                        style={{ cursor: 'pointer' }}
                                        title="View Profile"
                                    >
                                        <div className="user-avatar">
                                            {getFirstLetter(sender?.username)}
                                        </div>
                                        <div>
                                            <div className="request-user-name">{sender?.username}</div>
                                            <div className="request-user-email">{sender?.email}</div>
                                        </div>
                                    </div>

                                    <div className="request-card-actions">
                                        <button
                                            onClick={() => onRespondRequest(req._id, 'accept', sender._id)}
                                            className="btn-accept-mini"
                                            title="Accept Request"
                                        >
                                            <Check size={14} /> Accept
                                        </button>
                                        <button
                                            onClick={() => onRespondRequest(req._id, 'reject', sender._id)}
                                            className="btn-reject-mini"
                                            title="Decline"
                                        >
                                            <UserX size={14} />
                                        </button>
                                        <button 
                                            onClick={() => onOpenProfile(sender)} 
                                            className="btn-item-profile"
                                            title="View Profile"
                                        >
                                            <User size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )
                )}
            </div>
        </div>
    );
}
