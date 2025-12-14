import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from '../services/api';

// Web fallback for SecureStore
const storage = {
    getItem: async (key) => {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: async (key, value) => {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }
        return SecureStore.setItemAsync(key, value);
    },
    deleteItem: async (key) => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        return SecureStore.deleteItemAsync(key);
    },
};

const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    // Initialize auth state from secure storage
    initialize: async () => {
        try {
            const token = await storage.getItem('echomind_token');
            const userData = await storage.getItem('echomind_user');

            if (token && userData) {
                const user = JSON.parse(userData);
                api.setToken(token);
                set({ user, token, isAuthenticated: true, isLoading: false });
            } else {
                // No stored credentials - show login screen
                set({ user: null, token: null, isAuthenticated: false, isLoading: false });
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            // On error, show login screen
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
    },

    // Register user
    register: async (name, email, password) => {
        try {
            set({ isLoading: true, error: null });

            const response = await api.register({ name, email, password });
            const { user, token } = response.data;

            await storage.setItem('echomind_token', token);
            await storage.setItem('echomind_user', JSON.stringify(user));

            api.setToken(token);
            set({ user, token, isAuthenticated: true, isLoading: false });

            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed. Please try again.';
            set({ error: message, isLoading: false });
            return { success: false, message };
        }
    },

    // Login user
    login: async (email, password) => {
        try {
            set({ isLoading: true, error: null });

            const response = await api.login({ email, password });
            const { user, token } = response.data;

            await storage.setItem('echomind_token', token);
            await storage.setItem('echomind_user', JSON.stringify(user));

            api.setToken(token);
            set({ user, token, isAuthenticated: true, isLoading: false });

            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
            set({ error: message, isLoading: false });
            return { success: false, message };
        }
    },

    // Logout user
    logout: async () => {
        try {
            await storage.deleteItem('echomind_token');
            await storage.deleteItem('echomind_user');
            api.clearToken();
            set({ user: null, token: null, isAuthenticated: false, error: null });
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even on error
            set({ user: null, token: null, isAuthenticated: false, error: null });
        }
    },

    // Update user data
    updateUser: async (userData) => {
        const currentUser = get().user;
        const updatedUser = { ...currentUser, ...userData };
        set({ user: updatedUser });
        await storage.setItem('echomind_user', JSON.stringify(updatedUser));
    },

    // Clear error
    clearError: () => set({ error: null }),
}));

export default useAuthStore;
