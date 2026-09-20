import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isConnected: false,
    onlineUsers: []
};

const socketSlice = createSlice({
    name: 'socket',
    initialState,
    reducers: {
        setIsConnected: (state, action) => {
            state.isConnected = action.payload;
        },
        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload || [];
        }
    }
});

export const { setIsConnected, setOnlineUsers } = socketSlice.actions;
export default socketSlice.reducer;
