import axios from 'axios';
import { useAuthStore } from '@/store/auth';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
api.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
//# sourceMappingURL=api.js.map