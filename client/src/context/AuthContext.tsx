import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isUnder16?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, birthDate: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserName: (name: string) => void;
  updateUserAvatar: (avatar: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.46:8081';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const saveUser = async (u: User) => {
    setUser(u);
    await AsyncStorage.setItem('user', JSON.stringify(u));
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw { response: { data: err } };
    }
    const data = await res.json();
    const u: User = {
      id: data.user?.id || data.id,
      name: data.user?.username || data.user?.name || data.username || email,
      email: data.user?.email || email,
      avatar: data.user?.avatar,
      isUnder16: data.user?.isUnder16,
    };
    if (data.token) await AsyncStorage.setItem('token', data.token);
    await saveUser(u);
  };

  const register = async (email: string, password: string, username: string, birthDate: string) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, birthDate }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw { response: { data: err } };
    }
    const data = await res.json();
    const u: User = {
      id: data.user?.id || data.id,
      name: data.user?.username || data.user?.name || username,
      email: data.user?.email || email,
      avatar: data.user?.avatar,
      isUnder16: data.user?.isUnder16,
    };
    if (data.token) await AsyncStorage.setItem('token', data.token);
    await saveUser(u);
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.multiRemove(['user', 'token']);
  };

  const updateUserName = (name: string) => {
    if (!user) return;
    const updated = { ...user, name };
    setUser(updated);
    AsyncStorage.setItem('user', JSON.stringify(updated));
  };

  const updateUserAvatar = (avatar: string) => {
    if (!user) return;
    const updated = { ...user, avatar };
    setUser(updated);
    AsyncStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateUserName,
      updateUserAvatar,
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
