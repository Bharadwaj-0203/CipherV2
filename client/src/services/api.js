// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Add request interceptor for debugging
axios.interceptors.request.use(request => {
  console.log('Starting API Request:', request.url);
  console.log('Request Data:', request.data);
  return request;
});

// Add response interceptor for debugging
axios.interceptors.response.use(
  response => {
    console.log('API Response:', response.data);
    return response.data; // Return the data directly
  },
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

export const api = {
  auth: {
    login: async (username, password) => {
      try {
        console.log('Sending login request for:', username);
        const response = await axios.post(`${API_URL}/auth/login`, {
          username,
          password
        });
        return response; // This will be the data due to the interceptor
      } catch (error) {
        console.error('Login request failed:', error);
        throw error;
      }
    },

    register: async (username, password) => {
      try {
        console.log('Sending registration request for:', username);
        const response = await axios.post(`${API_URL}/auth/register`, {
          username,
          password
        });
        return response; // This will be the data due to the interceptor
      } catch (error) {
        console.error('Registration request failed:', error);
        throw error;
      }
    }
  }
};