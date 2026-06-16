import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, userApi } from '@/services/api';
import { getProfileAvatar } from '@/services/mockData';

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  email: string;
  bio: string;
  isUnder16: boolean;
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
  updateUserBio: (bio: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const decodeJwt = (token: string): Record<string, any> | null => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const applySession = (
  idToken: string,
  serverUser: any,
  setToken: (t: string) => void,
  setUser: (u: UserProfile) => void,
  setIsAuthenticated: (v: boolean) => void,
) => {
  const avatarId = serverUser.avatarId || serverUser.avatar || getProfileAvatar(serverUser.uid || serverUser.id || serverUser.username || '');
  setToken(idToken);
  setUser({
    id:        serverUser.uid       || serverUser.id || '',
    name:      serverUser.username  || 'Usuario',
    avatar:    avatarId,
    email:     serverUser.email     || '',
    bio:       serverUser.bio       || '',
    isUnder16: serverUser.isUnder16 || false,
  });
  setIsAuthenticated(true);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken   = await AsyncStorage.getItem('authToken');
        const savedEmail    = await AsyncStorage.getItem('savedEmail');
        const savedPassword = await AsyncStorage.getItem('savedPassword');

        if (storedToken) {
          const payload = decodeJwt(storedToken);
          if (!payload?.uid) throw new Error('token inválido');

          setToken(storedToken);
          setUser({
            id:        payload.uid,
            name:      payload.username  || 'Usuario',
            avatar:    payload.avatarId  || getProfileAvatar(payload.uid),
            email:     payload.email     || '',
            bio:       payload.bio       || '',
            isUnder16: payload.isUnder16 || false,
          });
          setIsAuthenticated(true);

          // fetch fresh profile to get current avatar and username
          try {
            const profileRes = await userApi.getMyProfile();
            const profile = (profileRes.data as any)?.profile;
            if (profile) {
              setUser((prev) => prev ? {
                ...prev,
                name:   profile.username || prev.name,
                avatar: profile.avatarId || profile.avatar || prev.avatar,
                bio:    profile.bio !== undefined ? profile.bio : (prev.bio || ''),
              } : prev);
            }
          } catch (err: any) {
            // token expired — try silent re-auth with saved credentials
            if (err?.response?.status === 401 && savedEmail && savedPassword) {
              try {
                const res = await authApi.login(savedEmail, savedPassword);
                const { idToken, user: su } = res.data;
                await AsyncStorage.setItem('authToken', idToken);
                applySession(idToken, su, setToken, setUser, setIsAuthenticated);
              } catch {
                setIsAuthenticated(false);
              }
            }
          }
        } else if (savedEmail && savedPassword) {
          // no token but credentials saved — silent login
          try {
            const res = await authApi.login(savedEmail, savedPassword);
            const { idToken, user: su } = res.data;
            await AsyncStorage.setItem('authToken', idToken);
            applySession(idToken, su, setToken, setUser, setIsAuthenticated);
          } catch {}
        }
      } catch {
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
    await AsyncStorage.multiSet([
      ['authToken',     idToken],
      ['savedEmail',    email],
      ['savedPassword', password],
    ]);
    applySession(idToken, { ...serverUser, email }, setToken, setUser, setIsAuthenticated);
  };

  const register = async (email: string, password: string, username: string, birthDate: string) => {
    const res = await authApi.register(email, password, username, birthDate);
    const { idToken, user: serverUser } = res.data;
    await AsyncStorage.multiSet([
      ['authToken',     idToken],
      ['savedEmail',    email],
      ['savedPassword', password],
    ]);
    applySession(idToken, { ...serverUser, email }, setToken, setUser, setIsAuthenticated);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['authToken', 'savedEmail', 'savedPassword']);
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

  const updateUserBio = (bio: string) => {
    setUser((prev) => (prev ? { ...prev, bio } : prev));
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, token, isLoading, login, register, logout, updateUserName, updateUserAvatar, updateUserBio }}
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
