// src/services/auth.service.js
import api from './api';

export const authService = {
  register: async (email, password, birthDate, username) => {
    const res = await api.post('/auth/register', { email, password, birthDate, username });
    return res.data;
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
};
