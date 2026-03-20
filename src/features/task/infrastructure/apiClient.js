import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

console.log('VITE_API_BASE_URL utilisé :', import.meta.env.VITE_API_BASE_URL);

export default apiClient;