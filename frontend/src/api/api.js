import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('socialhub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('socialhub_token');
      localStorage.removeItem('socialhub_user');
      // If window is available and not already on login, we could redirect or let AuthContext handle
    }
    return Promise.reject(error);
  }
);

export default api;
