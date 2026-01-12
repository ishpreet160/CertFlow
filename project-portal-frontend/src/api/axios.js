import axios from 'axios';

const isProduction = window.location.hostname !== 'localhost';
const baseURL = isProduction 
    ? 'https://tcil-backend.onrender.com/api' 
    : 'http://localhost:5000/api';

const api = axios.create({
    baseURL: baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});


api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// error handling 
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error("Backend Error:", error.response.data);
            console.error("Status Code:", error.response.status);
        } else if (error.request) {
            console.error("Network Error: No response received from Backend");
        }
        return Promise.reject(error);
    }
);

export default api;