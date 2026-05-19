import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production

export const useAuthStore = create((set) => ({
    user: typeof window !== 'undefined' ? (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null) : null,
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,

    register: async (data) => {
        try {
            const res = await axios.post(`${API_URL}/auth/register`, data);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            set({ user: res.data.user, token: res.data.token });
            return res.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    login: async (email, password) => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            set({ user: res.data.user, token: res.data.token });
            return res.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
    },

    updateProfile: async (data) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/auth/profile`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            localStorage.setItem('user', JSON.stringify(res.data));
            set({ user: res.data });
            return res.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
}));