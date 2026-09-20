'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { setIsConnected, setOnlineUsers } from '../redux/slices/socketSlice';
import { 
    receiveMessage, 
    fetchPendingRequests, 
    fetchUsers, 
    updateActiveUserRequestStatus,
    setNotification 
} from '../redux/slices/chatSlice';

const SocketContext = createContext();

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://chatting-site-4iv8.onrender.com';

export const SocketProvider = ({ children }) => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const { isConnected, onlineUsers } = useSelector((state) => state.socket);
    const [socket, setSocket] = useState(null);

    const userId = user?.id || user?._id;

    useEffect(() => {
        if (!userId) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                dispatch(setIsConnected(false));
                dispatch(setOnlineUsers([]));
            }
            return;
        }

        const socketInstance = io(SOCKET_URL, {
            autoConnect: true,
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        socketInstance.on('connect', () => {
            console.log('🟢 Socket connected to Render backend:', socketInstance.id);
            dispatch(setIsConnected(true));
            socketInstance.emit('register_user', userId);
        });

        socketInstance.on('disconnect', () => {
            console.log('🔴 Socket disconnected');
            dispatch(setIsConnected(false));
        });

        socketInstance.on('user_status_change', (data) => {
            if (data && Array.isArray(data.onlineUsers)) {
                dispatch(setOnlineUsers(data.onlineUsers));
            }
        });

        socketInstance.on('receive_message', (formattedMsg) => {
            dispatch(receiveMessage(formattedMsg));
        });

        socketInstance.on('incoming_request', () => {
            dispatch(fetchPendingRequests());
            dispatch(fetchUsers());
            dispatch(setNotification({ msg: 'New chat request received!', type: 'info' }));
        });

        socketInstance.on('request_response', ({ responderId, action, status }) => {
            dispatch(fetchUsers());
            dispatch(fetchPendingRequests());
            dispatch(updateActiveUserRequestStatus({ targetUserId: responderId, status }));

            if (action === 'accept') {
                dispatch(setNotification({
                    msg: 'Chat request accepted! You can now send real-time messages.',
                    type: 'info'
                }));
            }
        });

        socketInstance.on('error_message', ({ message }) => {
            dispatch(setNotification({ msg: message, type: 'error' }));
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [userId, dispatch]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
