import axios from 'axios';

const isProduction = window.location.hostname !== 'localhost';
const baseURL = isProduction 
    ? 'https://tcil-backend.onrender.com/api' 
    : 'http://localhost:5000/api';

const api = axios.create({
    baseURL: baseURL,
});


api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response ? error.response.status : null;

        if (status === 401) {
            // specific error code check
            const errorType = error.response.data?.error;
            
            if (errorType === 'token_expired' || errorType === 'token_invalid') {
                console.warn("Session expired. Redirecting to login...");
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                // Force redirect to login page
                window.location.href = '/login'; 
            }
        }

        if (status === 403) {
            alert("You do not have permission to perform this action. ❌");
        }

        console.error("API Error Detail:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default api;