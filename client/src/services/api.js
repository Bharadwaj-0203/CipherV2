//src/services/api.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error.response?.data || error);
    throw error.response?.data || error;
  }
);

export const api = {
  auth: {
    register: async (username, password) => {
      try {
        console.log('Attempting registration for:', username);
        return await axiosInstance.post('/auth/register', {
          username,
          password
        });
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      }
    },

    login: async (username, password) => {
      try {
        console.log('Attempting login for:', username);
        return await axiosInstance.post('/auth/login', {
          username,
          password
        });
      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },

    verify: async () => {
      return await axiosInstance.get('/auth/verify');
    }
  },

  messages: {
    getAll: async () => {
      try {
        return await axiosInstance.get('/messages/all');
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        throw error;
      }
    }
  }
};