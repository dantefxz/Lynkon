// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://lynkon.onrender.com/api'; // ← Cambiar por tu URL de Render

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: adjunta el token JWT automáticamente
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('lynkon_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: manejo de errores global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Error de red';
    return Promise.reject(new Error(message));
  }
);

export default api;
