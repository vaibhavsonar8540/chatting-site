'use client';

import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
    fetchUsers, 
    fetchPendingRequests, 
    fetchMessages, 
    sendMessage, 
    sendRequest, 
    respondRequest,
    setActiveUser,
    setProfileUser,
    clearNotification 
} from '../redux/slices/chatSlice';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import UserProfileModal from './UserProfileModal';

export default function ChatDashboard() {
    const dispatch = useDispatch();
    const { user, token, logout } = useAuth();
    const { socket, onlineUsers } = useSocket();

    const {
        users,
        pendingRequests,
        activeUser,
        messages,
        loadingMessages,
        notification,
        profileUser
    } = useSelector((state) => state.chat);

    // Initial load
    useEffect(() => {
        if (token) {
            dispatch(fetchUsers());
            dispatch(fetchPendingRequests());
        }
    }, [dispatch, token]);

    // Auto-select first connected friend on desktop if no active chat is selected
    useEffect(() => {
        if (!activeUser && users.length > 0) {
            const firstFriend = users.find((u) => u.requestStatus === 'accepted');
            if (firstFriend && typeof window !== 'undefined' && window.innerWidth > 768) {
                dispatch(setActiveUser(firstFriend));
                dispatch(fetchMessages(firstFriend._id));
            }
        }
    }, [users, activeUser, dispatch]);

    // Select user handler
    const handleSelectUser = (selectedUser) => {
        dispatch(setActiveUser(selectedUser));
        dispatch(fetchMessages(selectedUser._id));
    };

    // Send Message handler
    const handleSendMessage = (text) => {
        if (!activeUser || !text.trim()) return;
        dispatch(sendMessage({ receiverId: activeUser._id, text: text.trim(), socket }));
    };

    // Send Chat Request handler
    const handleSendRequest = (receiverId) => {
        dispatch(sendRequest({ receiverId, socket }));
    };

    // Respond Request handler (accept/reject)
    const handleRespondRequest = (requestId, action, targetUserId) => {
        dispatch(respondRequest({ requestId, action, targetUserId, socket }));
    };

    return (
        <div className="chat-app-dashboard">
            {/* User Profile Modal */}
            {profileUser && (
                <UserProfileModal
                    targetUser={profileUser}
                    currentUser={user}
                    isOnline={profileUser ? (onlineUsers || []).includes(profileUser._id) : false}
                    onClose={() => dispatch(setProfileUser(null))}
                    onSendRequest={handleSendRequest}
                    onRespondRequest={handleRespondRequest}
                    onLogout={logout}
                    onStartChat={(target) => {
                        handleSelectUser(target);
                        dispatch(setProfileUser(null));
                    }}
                />
            )}

            {/* Notification Toast */}
            {notification && (
                <div className={`notification-toast ${notification.type}`}>
                    <span>{notification.msg}</span>
                    <button onClick={() => dispatch(clearNotification())} className="toast-close">×</button>
                </div>
            )}

            {/* Main Chat Grid Layout */}
            <div className={`chat-layout-grid ${activeUser ? 'mobile-chat-open' : ''}`}>
                <ChatSidebar
                    users={users}
                    activeUser={activeUser}
                    onSelectUser={handleSelectUser}
                    pendingRequests={pendingRequests}
                    onSendRequest={handleSendRequest}
                    onRespondRequest={handleRespondRequest}
                    onLogout={logout}
                    onOpenProfile={(u) => dispatch(setProfileUser(u))}
                />

                <ChatWindow
                    activeUser={activeUser}
                    messages={messages}
                    loadingMessages={loadingMessages}
                    onSendMessage={handleSendMessage}
                    onSendRequest={handleSendRequest}
                    onRespondRequest={handleRespondRequest}
                    onBackToList={() => dispatch(setActiveUser(null))}
                    onOpenProfile={(u) => dispatch(setProfileUser(u))}
                />
            </div>
        </div>
    );
}
