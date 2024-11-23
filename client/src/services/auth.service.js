// src/services/auth.service.js
import { api } from './api';

export const authService = {
  login: async (agentId, password) => {
    const response = await api.post('/auth/login', { agentId, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};