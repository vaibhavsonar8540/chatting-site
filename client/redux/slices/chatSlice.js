import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://chatting-site-4iv8.onrender.com/api';

// Async Thunks
export const fetchUsers = createAsyncThunk(
    'chat/fetchUsers',
    async (_, { getState, rejectWithValue }) => {
        const token = getState().auth.token;
        if (!token) return [];
        try {
            const res = await fetch(`${API_BASE_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                return data.users || [];
            }
            return rejectWithValue(data.message || 'Failed to fetch users');
        } catch (err) {
            return rejectWithValue('Network error fetching users');
        }
    }
);

export const fetchPendingRequests = createAsyncThunk(
    'chat/fetchPendingRequests',
    async (_, { getState, rejectWithValue }) => {
        const token = getState().auth.token;
        if (!token) return [];
        try {
            const res = await fetch(`${API_BASE_URL}/requests/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                return data.requests || [];
            }
            return rejectWithValue(data.message || 'Failed to fetch pending requests');
        } catch (err) {
            return rejectWithValue('Network error fetching requests');
        }
    }
);

export const fetchMessages = createAsyncThunk(
    'chat/fetchMessages',
    async (targetUserId, { getState, rejectWithValue }) => {
        const token = getState().auth.token;
        if (!token || !targetUserId) return [];
        try {
            const res = await fetch(`${API_BASE_URL}/messages/${targetUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                return { targetUserId, messages: data.messages || [] };
            }
            return rejectWithValue(data.message || 'Failed to fetch messages');
        } catch (err) {
            return rejectWithValue('Network error fetching messages');
        }
    }
);

export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async ({ receiverId, text, socket }, { getState, dispatch, rejectWithValue }) => {
        const token = getState().auth.token;
        const currentUserId = getState().auth.user?.id || getState().auth.user?._id;

        if (socket && socket.connected) {
            socket.emit('send_message', {
                senderId: currentUserId,
                receiverId,
                text: text.trim()
            });
            return null; // socket event listener handles updating state
        }

        // Fallback HTTP request
        try {
            const res = await fetch(`${API_BASE_URL}/messages/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ receiverId, text: text.trim() })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                return data.message;
            }
            return rejectWithValue(data.message || 'Failed to send message');
        } catch (err) {
            return rejectWithValue('Network error sending message');
        }
    }
);

export const sendRequest = createAsyncThunk(
    'chat/sendRequest',
    async ({ receiverId, socket }, { getState, dispatch, rejectWithValue }) => {
        const token = getState().auth.token;
        const currentUserId = getState().auth.user?.id || getState().auth.user?._id;
        try {
            const res = await fetch(`${API_BASE_URL}/requests/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ receiverId })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                if (socket) {
                    socket.emit('send_request_event', { senderId: currentUserId, receiverId });
                }
                dispatch(fetchUsers());
                return { receiverId, message: data.message };
            }
            return rejectWithValue(data.message || 'Failed to send request');
        } catch (err) {
            return rejectWithValue('Error sending chat request');
        }
    }
);

export const respondRequest = createAsyncThunk(
    'chat/respondRequest',
    async ({ requestId, action, targetUserId, socket }, { getState, dispatch, rejectWithValue }) => {
        const token = getState().auth.token;
        const currentUserId = getState().auth.user?.id || getState().auth.user?._id;
        try {
            const res = await fetch(`${API_BASE_URL}/requests/respond`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ requestId, targetUserId, action })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                if (socket) {
                    socket.emit('respond_request_event', {
                        senderId: currentUserId,
                        receiverId: targetUserId,
                        action
                    });
                }
                dispatch(fetchUsers());
                dispatch(fetchPendingRequests());
                return { targetUserId, action, status: action === 'accept' ? 'accepted' : 'rejected' };
            }
            return rejectWithValue(data.message || 'Failed to respond to request');
        } catch (err) {
            return rejectWithValue('Error responding to request');
        }
    }
);

const initialState = {
    users: [],
    pendingRequests: [],
    activeUser: null,
    messages: [],
    loadingMessages: false,
    notification: null,
    profileUser: null
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setActiveUser: (state, action) => {
            state.activeUser = action.payload;
            if (action.payload) {
                state.users = state.users.map((u) =>
                    u._id === action.payload._id ? { ...u, unreadCount: 0 } : u
                );
            }
        },
        setProfileUser: (state, action) => {
            state.profileUser = action.payload;
        },
        setNotification: (state, action) => {
            state.notification = action.payload;
        },
        clearNotification: (state) => {
            state.notification = null;
        },
        receiveMessage: (state, action) => {
            const formattedMsg = action.payload;
            const activeUser = state.activeUser;

            const isRelevant = activeUser && (formattedMsg.sender === activeUser._id || formattedMsg.receiver === activeUser._id);
            if (isRelevant) {
                const exists = state.messages.some((m) => m._id === formattedMsg._id);
                if (!exists) {
                    state.messages.push(formattedMsg);
                }
            }

            state.users = state.users.map((u) => {
                const isOtherUser = u._id === formattedMsg.sender || u._id === formattedMsg.receiver;
                if (isOtherUser) {
                    const isSender = formattedMsg.sender === u._id;
                    const shouldIncrement = isSender && (!activeUser || activeUser._id !== u._id);

                    return {
                        ...u,
                        lastMessage: {
                            text: formattedMsg.text,
                            sender: formattedMsg.sender,
                            createdAt: formattedMsg.createdAt
                        },
                        unreadCount: shouldIncrement ? (u.unreadCount || 0) + 1 : u.unreadCount
                    };
                }
                return u;
            });
        },
        updateActiveUserRequestStatus: (state, action) => {
            if (state.activeUser && state.activeUser._id === action.payload.targetUserId) {
                state.activeUser.requestStatus = action.payload.status;
            }
        }
    },
    extraReducers: (builder) => {
        // fetchUsers
        builder.addCase(fetchUsers.fulfilled, (state, action) => {
            state.users = action.payload;
        });

        // fetchPendingRequests
        builder.addCase(fetchPendingRequests.fulfilled, (state, action) => {
            state.pendingRequests = action.payload;
        });

        // fetchMessages
        builder.addCase(fetchMessages.pending, (state) => {
            state.loadingMessages = true;
        });
        builder.addCase(fetchMessages.fulfilled, (state, action) => {
            state.messages = action.payload.messages;
            state.loadingMessages = false;
        });
        builder.addCase(fetchMessages.rejected, (state) => {
            state.loadingMessages = false;
        });

        // sendMessage HTTP fallback
        builder.addCase(sendMessage.fulfilled, (state, action) => {
            if (action.payload) {
                state.messages.push(action.payload);
            }
        });

        // sendRequest
        builder.addCase(sendRequest.fulfilled, (state, action) => {
            state.notification = { msg: 'Chat request sent successfully!', type: 'info' };
            if (state.activeUser && state.activeUser._id === action.payload.receiverId) {
                state.activeUser.requestStatus = 'pending_sent';
            }
        });
        builder.addCase(sendRequest.rejected, (state, action) => {
            state.notification = { msg: action.payload || 'Failed to send request', type: 'error' };
        });

        // respondRequest
        builder.addCase(respondRequest.fulfilled, (state, action) => {
            const { targetUserId, action: act, status } = action.payload;
            state.notification = {
                msg: `Request ${act === 'accept' ? 'accepted' : 'declined'}!`,
                type: 'info'
            };
            if (state.activeUser && state.activeUser._id === targetUserId) {
                state.activeUser.requestStatus = status;
            }
        });
        builder.addCase(respondRequest.rejected, (state, action) => {
            state.notification = { msg: action.payload || 'Failed to respond to request', type: 'error' };
        });
    }
});

export const {
    setActiveUser,
    setProfileUser,
    setNotification,
    clearNotification,
    receiveMessage,
    updateActiveUserRequestStatus
} = chatSlice.actions;

export default chatSlice.reducer;
