'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
    User,
    Send, 
    Lock, 
    UserCheck, 
    UserPlus, 
    UserX, 
    Check, 
    CheckCheck, 
    Clock, 
    Smile, 
    ArrowLeft,
    ShieldAlert,
    Sparkles,
    Circle
} from 'lucide-react';

const COMMON_EMOJIS = ['😊', '😂', '🔥', '👍', '❤️', '👋', '🎉', '🙌', '💯', '✨', '😎', '🚀'];

export default function ChatWindow({
    activeUser,
    messages,
    loadingMessages,
    onSendMessage,
    onSendRequest,
    onRespondRequest,
    onBackToList,
    onOpenProfile
}) {
    const { user: currentUser, token } = useAuth();
    const { socket, onlineUsers } = useSocket();
    const [text, setText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const activeUserIdStr = activeUser ? String(activeUser._id || activeUser.id) : '';
    const currentUserIdStr = currentUser ? String(currentUser.id || currentUser._id) : '';
    const isOnline = activeUserIdStr ? (onlineUsers || []).map(String).includes(activeUserIdStr) : false;

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Handle Escape key to go back to chat list
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onBackToList();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onBackToList]);

    // Handle typing events
    const handleTextChange = (e) => {
        setText(e.target.value);

        if (!socket || !activeUser) return;

        if (!isTyping) {
            socket.emit('typing', { senderId: currentUserIdStr, receiverId: activeUserIdStr });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop_typing', { senderId: currentUserIdStr, receiverId: activeUserIdStr });
        }, 2000);
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!text.trim() || !activeUser) return;

        onSendMessage(text.trim());
        setText('');
        setShowEmojiPicker(false);

        if (socket && activeUser) {
            socket.emit('stop_typing', { senderId: currentUserIdStr, receiverId: activeUserIdStr });
        }
    };

    const addEmoji = (emoji) => {
        setText((prev) => prev + emoji);
    };

    const handleAccept = async () => {
        setActionLoading(true);
        await onRespondRequest(activeUser.requestId, 'accept', activeUser._id);
        setActionLoading(false);
    };

    const handleReject = async () => {
        setActionLoading(true);
        await onRespondRequest(activeUser.requestId, 'reject', activeUser._id);
        setActionLoading(false);
    };

    const handleSendReq = async () => {
        setActionLoading(true);
        await onSendRequest(activeUser._id);
        setActionLoading(false);
    };

    if (!activeUser) {
        return (
            <div className="chat-empty-state">
                <div className="empty-state-glow"></div>
                <div className="empty-state-icon">
                    <Sparkles size={48} className="sparkle-icon" />
                </div>
                <h2>Select a Chat to Start Messaging</h2>
                <p>Real-time end-to-end messaging with WebSocket speed and request authorization.</p>
                
                <div className="features-badge-list">
                    <div className="feature-badge">
                        <Lock size={14} /> Request-based Messaging
                    </div>
                    <div className="feature-badge">
                        <Circle size={8} fill="#10b981" color="#10b981" /> Live Online Status
                    </div>
                    <div className="feature-badge">
                        <Clock size={14} /> Message History Stored
                    </div>
                </div>
            </div>
        );
    }

    const requestStatus = activeUser.requestStatus || 'none';
    const canChat = requestStatus === 'accepted';

    const getFirstLetter = (name) => (name ? name.charAt(0).toUpperCase() : 'U');

    return (
        <div className="chat-window">
            {/* Top Bar Header */}
            <div className="chat-header">
                <div className="header-left">
                    <button 
                        className="chat-back-btn" 
                        onClick={(e) => { e.stopPropagation(); onBackToList(); }} 
                        title="Back to chat list (Esc)"
                        aria-label="Back to conversations"
                    >
                        <ArrowLeft size={18} />
                        <span className="back-btn-text">Back</span>
                    </button>

                    <div 
                        className="header-user-info"
                        onClick={() => onOpenProfile && onOpenProfile(activeUser)}
                        title="View user profile"
                    >
                        <div className="user-avatar-container">
                            <div className="user-avatar">
                                {getFirstLetter(activeUser.username)}
                            </div>
                            <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
                        </div>

                        <div>
                            <div className="chat-username">
                                {activeUser.username}
                            </div>
                            <div className="chat-status-subtitle">
                                {isOnline ? (
                                    <span className="online-text">Online</span>
                                ) : (
                                    <span className="offline-text">Offline</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="header-actions">
                    <button 
                        onClick={() => onOpenProfile && onOpenProfile(activeUser)} 
                        className="icon-btn-profile" 
                        title="View User Profile"
                        style={{ marginRight: '0.25rem' }}
                    >
                        <User size={18} />
                    </button>

                    {canChat && (
                        <span className="badge badge-success">
                            <UserCheck size={13} /> Connected
                        </span>
                    )}
                    {requestStatus === 'pending_sent' && (
                        <span className="badge badge-warning">
                            <Clock size={13} /> Request Sent
                        </span>
                    )}
                    {requestStatus === 'pending_received' && (
                        <span className="badge badge-info">
                            <ShieldAlert size={13} /> Request Incoming
                        </span>
                    )}
                    {(requestStatus === 'none' || requestStatus === 'rejected') && (
                        <span className="badge badge-secondary">
                            Not Connected
                        </span>
                    )}
                </div>
            </div>

            {/* Request Status Banner */}
            {!canChat && (
                <div className="request-banner">
                    {requestStatus === 'pending_received' && (
                        <div className="banner-content">
                            <div className="banner-text">
                                <strong>{activeUser.username}</strong> sent you a chat request. Accept the request to start messaging!
                            </div>
                            <div className="banner-actions">
                                <button onClick={handleAccept} disabled={actionLoading} className="btn-accept">
                                    <Check size={16} /> Accept Request
                                </button>
                                <button onClick={handleReject} disabled={actionLoading} className="btn-reject">
                                    <UserX size={16} /> Decline
                                </button>
                            </div>
                        </div>
                    )}

                    {requestStatus === 'pending_sent' && (
                        <div className="banner-content warning">
                            <Clock size={18} style={{ flexShrink: 0 }} />
                            <span>Chat request sent to <strong>{activeUser.username}</strong>. You will be able to send messages once they accept your request.</span>
                        </div>
                    )}

                    {(requestStatus === 'none' || requestStatus === 'rejected') && (
                        <div className="banner-content neutral">
                            <span>You need to send a chat request and get accepted by <strong>{activeUser.username}</strong> before sending messages.</span>
                            <button onClick={handleSendReq} disabled={actionLoading} className="btn-primary" style={{ padding: '0.45rem 1rem', width: 'auto' }}>
                                <UserPlus size={16} /> Send Chat Request
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Messages Container */}
            <div className="messages-container">
                {loadingMessages ? (
                    <div className="loading-spinner-container">
                        <div className="spinner"></div>
                        <span>Loading chat history...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="empty-messages-hint">
                        <div className="hint-icon">💬</div>
                        <h4>No messages yet</h4>
                        <p>{canChat ? `Say hi to ${activeUser.username}!` : `Once request is accepted, your messages will appear here.`}</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const msgSenderIdStr = String(typeof msg.sender === 'object' ? (msg.sender._id || msg.sender.id) : msg.sender);
                        const isSender = msgSenderIdStr === currentUserIdStr;
                        const msgTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={msg._id || idx} className={`message-row ${isSender ? 'sent' : 'received'}`}>
                                <div className="message-bubble">
                                    <div className="message-text">{msg.text}</div>
                                    <div className="message-meta">
                                        <span className="message-time">{msgTime}</span>
                                        {isSender && (
                                            <span className="read-status">
                                                {msg.read ? <CheckCheck size={14} className="read-icon" /> : <Check size={14} />}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {isTyping && (
                    <div className="message-row received">
                        <div className="typing-indicator-bubble">
                            <span>{activeUser.username} is typing</span>
                            <div className="typing-dots">
                                <div></div>
                                <div></div>
                                <div></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Emoji Selector Popup */}
            {showEmojiPicker && (
                <div className="emoji-picker-popup">
                    <div className="emoji-grid">
                        {COMMON_EMOJIS.map((emoji) => (
                            <button key={emoji} type="button" onClick={() => addEmoji(emoji)} className="emoji-btn">
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom Message Input Form */}
            <form onSubmit={handleSend} className="chat-input-form">
                <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="emoji-toggle-btn"
                    disabled={!canChat}
                    title="Choose emoji"
                >
                    <Smile size={20} />
                </button>

                <input
                    type="text"
                    value={text}
                    onChange={handleTextChange}
                    placeholder={
                        canChat
                            ? `Message ${activeUser.username}...`
                            : `Receiver must accept request to enable messaging...`
                    }
                    disabled={!canChat}
                    className="chat-input-field"
                />

                <button
                    type="submit"
                    disabled={!canChat || !text.trim()}
                    className="btn-send-message"
                    title={canChat ? "Send Message" : "Locked until request accepted"}
                >
                    {canChat ? <Send size={18} /> : <Lock size={18} />}
                </button>
            </form>
        </div>
    );
}
