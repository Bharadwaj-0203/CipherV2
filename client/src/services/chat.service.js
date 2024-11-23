// src/services/chat.service.js
import api from './api';

export const chatService = {
  getMessages: async (chatId) => {
    const response = await api.get(`/chat/messages/${chatId}`);
    return response.data;
  },

  sendMessage: async (message) => {
    const response = await api.post('/chat/send', message);
    return response.data;
  },

  getAgents: async () => {
    const response = await api.get('/chat/agents');
    return response.data;
  }
};