import axios from 'axios';
import { authStorage } from './utils';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = authStorage.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            authStorage.clear();
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    register: async (data) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },
    login: async (data) => {
        const response = await api.post('/auth/login', data);
        return response.data;
    },
    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    forgotPassword: async (email) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },
    resetPassword: async (token, newPassword) => {
        const response = await api.post('/auth/reset-password', { 
            token, 
            new_password: newPassword 
        });
        return response.data;
    },
    verifyResetToken: async (token) => {
        const response = await api.get(`/auth/verify-reset-token/${token}`);
        return response.data;
    },
};

// User API
export const userApi = {
    updateProfile: async (data) => {
        const response = await api.patch('/user/profile', data);
        return response.data;
    },
};

// Mood API
export const moodApi = {
    create: async (mood) => {
        const response = await api.post('/mood', { mood });
        return response.data;
    },
    getToday: async () => {
        const response = await api.get('/mood/today');
        return response.data;
    },
};

// Affirmation API
export const affirmationApi = {
    generate: async (mood, careerGoal = null) => {
        const response = await api.post('/affirmation/generate', { 
            mood, 
            career_goal: careerGoal 
        });
        return response.data;
    },
    getToday: async () => {
        const response = await api.get('/affirmation/today');
        return response.data;
    },
};

// Session API
export const sessionApi = {
    create: async (sessionType) => {
        const response = await api.post('/session', { session_type: sessionType });
        return response.data;
    },
    update: async (sessionId, data) => {
        const response = await api.patch(`/session/${sessionId}`, data);
        return response.data;
    },
    getToday: async () => {
        const response = await api.get('/session/today');
        return response.data;
    },
};

// Water API
export const waterApi = {
    log: async () => {
        const response = await api.post('/water');
        return response.data;
    },
    getTodayCount: async () => {
        const response = await api.get('/water/today');
        return response.data;
    },
};

// Reflection API
export const reflectionApi = {
    create: async (data) => {
        const response = await api.post('/reflection', data);
        return response.data;
    },
    update: async (data) => {
        const response = await api.patch('/reflection', data);
        return response.data;
    },
    getToday: async () => {
        const response = await api.get('/reflection/today');
        return response.data;
    },
};

// Progress API
export const progressApi = {
    get: async (period) => {
        const response = await api.get(`/progress/${period}`);
        return response.data;
    },
};

// Health check
export const healthCheck = async () => {
    const response = await api.get('/health');
    return response.data;
};

export default api;
