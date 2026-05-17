import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, userApi } from '@/services/api';

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, birthDate: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserName: (name: string) => void;
  updateUserAvatar: (avatar: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on boot
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          setToken(storedToken);
          const res = await userApi.getMyProfile();
          const profile = res.data;
          setUser({
            id: profile.id,
            name: profile.username || profile.name || 'Usuario',
            avatar: profile.avatar || '',
            email: profile.email || '',
          });
          setIsAuthenticated(true);
        }
      } catch {
        // Token expired or invalid — clear it
        await AsyncStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { idToken, user: serverUser } = res.data;
    await AsyncStorage.setItem('authToken', idToken);
    setToken(idToken);
    setUser({
      id: serverUser.id,
      name: serverUser.username || serverUser.name || 'Usuario',
      avatar: serverUser.avatar || '',
      email: serverUser.email || email,
    });
    setIsAuthenticated(true);
  };

  const register = async (email: string, password: string, username: string, birthDate: string) => {
    const res = await authApi.register(email, password, username, birthDate);
    const { idToken, user: serverUser } = res.data;
    await AsyncStorage.setItem('authToken', idToken);
    setToken(idToken);
    setUser({
      id: serverUser.id,
      name: serverUser.username || username,
      avatar: serverUser.avatar || '',
      email: email,
    });
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUserName = (name: string) => {
    setUser((prev) => (prev ? { ...prev, name } : prev));
  };

  const updateUserAvatar = (avatar: string) => {
    setUser((prev) => (prev ? { ...prev, avatar } : prev));
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, token, isLoading, login, register, logout, updateUserName, updateUserAvatar }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
