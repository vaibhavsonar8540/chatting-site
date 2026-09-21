'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchUserProfile, 
    loginUser, 
    registerUser, 
    logoutUser, 
    checkServerHealth,
    setLoading
} from '../redux/slices/authSlice';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const dispatch = useDispatch();
    const { user, token, loading, serverStatus, error } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(checkServerHealth());
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (storedToken) {
            dispatch(fetchUserProfile(storedToken));
        } else {
            dispatch(setLoading(false));
        }

        const healthInterval = setInterval(() => {
            dispatch(checkServerHealth());
        }, 15000);

        return () => clearInterval(healthInterval);
    }, [dispatch]);

    const register = async (username, email, password) => {
        const result = await dispatch(registerUser({ username, email, password }));
        if (registerUser.fulfilled.match(result)) {
            return { success: true, message: 'Account registered successfully!' };
        } else {
            return { success: false, message: result.payload || 'Registration failed' };
        }
    };

    const login = async (email, password) => {
        const result = await dispatch(loginUser({ email, password }));
        if (loginUser.fulfilled.match(result)) {
            return { success: true, message: 'Logged in successfully!' };
        } else {
            return { success: false, message: result.payload || 'Login failed' };
        }
    };

    const logout = async () => {
        await dispatch(logoutUser());
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                serverStatus,
                error,
                register,
                login,
                logout,
                fetchUserProfile: (t) => dispatch(fetchUserProfile(t)),
                checkServerHealth: () => dispatch(checkServerHealth())
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
