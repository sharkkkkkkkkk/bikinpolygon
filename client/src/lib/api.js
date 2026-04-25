import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Relative path to work with proxy (dev) and Vercel rewrites (prod)
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
