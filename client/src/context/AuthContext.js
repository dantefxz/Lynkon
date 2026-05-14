// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al arrancar, verificar si hay sesión guardada
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('lynkon_token');
        const savedUser  = await AsyncStorage.getItem('lynkon_user');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error cargando sesión:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    await AsyncStorage.setItem('lynkon_token', result.idToken);
    await AsyncStorage.setItem('lynkon_user', JSON.stringify(result.user));
    setToken(result.idToken);
    setUser(result.user);
    setIsAuthenticated(true);
    return result;
  };

  const register = async (email, password, birthDate, username) => {
    const result = await authService.register(email, password, birthDate, username);
    await AsyncStorage.setItem('lynkon_token', result.idToken);
    await AsyncStorage.setItem('lynkon_user', JSON.stringify(result.user));
    setToken(result.idToken);
    setUser(result.user);
    setIsAuthenticated(true);
    return result;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('lynkon_token');
    await AsyncStorage.removeItem('lynkon_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    AsyncStorage.setItem('lynkon_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated, user, token, loading,
      login, register, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
