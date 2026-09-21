import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://chatting-site-4iv8.onrender.com/api').replace(/\/+$/, '');

// Async Thunks
export const checkServerHealth = createAsyncThunk(
    'auth/checkServerHealth',
    async (_, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE_URL}/health`);
            if (res.ok) return 'online';
            return 'offline';
        } catch (error) {
            return 'offline';
        }
    }
);

export const fetchUserProfile = createAsyncThunk(
    'auth/fetchUserProfile',
    async (jwtToken, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                return data.user;
            } else {
                if (typeof window !== 'undefined') localStorage.removeItem('token');
                return rejectWithValue(data.message || 'Session expired');
            }
        } catch (err) {
            return rejectWithValue('Failed to verify user session');
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async ({ username, email, password }, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                return rejectWithValue(data.message || 'Registration failed');
            }

            if (data.token && typeof window !== 'undefined') {
                localStorage.setItem('token', data.token);
            }
            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Network error during registration');
        }
    }
);

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                return rejectWithValue(data.message || 'Login failed');
            }

            if (data.token && typeof window !== 'undefined') {
                localStorage.setItem('token', data.token);
            }
            return data;
        } catch (error) {
            return rejectWithValue(error.message || 'Network error during login');
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async () => {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
        } catch (err) {
            // Ignore fetch errors during logout
        } finally {
            if (typeof window !== 'undefined') localStorage.removeItem('token');
        }
        return null;
    }
);

const getInitialToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

const initialToken = getInitialToken();

const initialState = {
    user: null,
    token: initialToken,
    loading: !!initialToken,
    serverStatus: 'checking',
    error: null
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setToken: (state, action) => {
            state.token = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        // Health Check
        builder.addCase(checkServerHealth.fulfilled, (state, action) => {
            state.serverStatus = action.payload;
        });
        builder.addCase(checkServerHealth.rejected, (state) => {
            state.serverStatus = 'offline';
        });

        // Fetch User Profile
        builder.addCase(fetchUserProfile.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
            state.user = action.payload;
            state.loading = false;
        });
        builder.addCase(fetchUserProfile.rejected, (state) => {
            state.user = null;
            state.token = null;
            state.loading = false;
        });

        // Register
        builder.addCase(registerUser.fulfilled, (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.loading = false;
            state.error = null;
        });
        builder.addCase(registerUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // Login
        builder.addCase(loginUser.fulfilled, (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.loading = false;
            state.error = null;
        });
        builder.addCase(loginUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // Logout
        builder.addCase(logoutUser.fulfilled, (state) => {
            state.user = null;
            state.token = null;
            state.loading = false;
        });
    }
});

export const { setToken, setLoading, clearError } = authSlice.actions;
export default authSlice.reducer;
