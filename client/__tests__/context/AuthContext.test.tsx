import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Mock API services
jest.mock('@/services/api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
  },
  userApi: {
    getMyProfile: jest.fn(),
    setStatus: jest.fn(),
  },
}));

import { authApi, userApi } from '@/services/api';
const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockUserApi = userApi as jest.Mocked<typeof userApi>;

// A valid JWT with uid, email, username fields (base64 encoded)
const makeToken = (payload: Record<string, any>) => {
  const encoded = btoa(JSON.stringify(payload));
  return `header.${encoded}.signature`;
};

const validToken = makeToken({ uid: 'user1', username: 'Gamer', email: 'g@test.com' });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    mockUserApi.getMyProfile.mockResolvedValue({ data: { profile: null } } as any);
  });

  describe('initial state', () => {
    it('starts unauthenticated once loading finishes', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('sets isAuthenticated to true on successful login', async () => {
      mockAuthApi.login.mockResolvedValueOnce({
        data: { idToken: validToken, user: { uid: 'u1', username: 'Gamer', email: 'g@t.com' } },
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
        await result.current.login('g@t.com', 'pass');
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('stores token and credentials in AsyncStorage', async () => {
      mockAuthApi.login.mockResolvedValueOnce({
        data: { idToken: validToken, user: { uid: 'u1', username: 'Gamer', email: 'g@t.com' } },
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
        await result.current.login('g@t.com', 'pass');
      });

      expect(await AsyncStorage.getItem('authToken')).toBe(validToken);
      expect(await AsyncStorage.getItem('savedEmail')).toBe('g@t.com');
      expect(await AsyncStorage.getItem('savedPassword')).toBe('pass');
    });

    it('sets user profile data from server response', async () => {
      mockAuthApi.login.mockResolvedValueOnce({
        data: {
          idToken: validToken,
          user: { uid: 'u1', username: 'ProGamer', email: 'pro@t.com', bio: 'I play games' },
        },
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
        await result.current.login('pro@t.com', 'pass');
      });

      expect(result.current.user?.name).toBe('ProGamer');
      expect(result.current.user?.email).toBe('pro@t.com');
    });

    it('propagates errors thrown by the API', async () => {
      mockAuthApi.login.mockRejectedValueOnce(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      await expect(
        act(async () => {
          await result.current.login('bad@t.com', 'wrong');
        }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('sets isAuthenticated to true on successful registration', async () => {
      mockAuthApi.register.mockResolvedValueOnce({
        data: {
          idToken: validToken,
          user: { uid: 'u2', username: 'NewPlayer', email: 'new@t.com' },
        },
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
        await result.current.register('new@t.com', 'pass', 'NewPlayer', '2000-01-01');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.name).toBe('NewPlayer');
    });
  });

  describe('logout', () => {
    it('clears auth state and AsyncStorage', async () => {
      mockAuthApi.login.mockResolvedValueOnce({
        data: { idToken: validToken, user: { uid: 'u1', username: 'Gamer', email: 'g@t.com' } },
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
        await result.current.login('g@t.com', 'pass');
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(await AsyncStorage.getItem('authToken')).toBeNull();
      expect(await AsyncStorage.getItem('savedEmail')).toBeNull();
    });
  });

  describe('profile update helpers', () => {
    async function loginAndGetResult() {
      mockAuthApi.login.mockResolvedValueOnce({
        data: { idToken: validToken, user: { uid: 'u1', username: 'Gamer', email: 'g@t.com' } },
      } as any);
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
        await result.current.login('g@t.com', 'pass');
      });
      return result;
    }

    it('updateUserName updates the user name', async () => {
      const result = await loginAndGetResult();
      act(() => { result.current.updateUserName('SuperGamer'); });
      expect(result.current.user?.name).toBe('SuperGamer');
    });

    it('updateUserAvatar updates the avatar', async () => {
      const result = await loginAndGetResult();
      act(() => { result.current.updateUserAvatar('avatar_05'); });
      expect(result.current.user?.avatar).toBe('avatar_05');
    });

    it('updateUserBio updates the bio', async () => {
      const result = await loginAndGetResult();
      act(() => { result.current.updateUserBio('New bio text'); });
      expect(result.current.user?.bio).toBe('New bio text');
    });
  });

  describe('session restore', () => {
    it('restores session from valid stored token', async () => {
      await AsyncStorage.setItem('authToken', validToken);
      mockUserApi.getMyProfile.mockResolvedValueOnce({ data: { profile: null } } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.id).toBe('user1');
    });

    it('applies fresh profile from getMyProfile after token restore', async () => {
      await AsyncStorage.setItem('authToken', validToken);
      mockUserApi.getMyProfile.mockResolvedValueOnce({
        data: { profile: { username: 'Updated', avatarId: 'av02', bio: 'New bio' } },
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.user?.name).toBe('Updated');
      expect(result.current.user?.avatar).toBe('av02');
    });

    it('does silent re-login when getMyProfile returns 401 with saved credentials', async () => {
      await AsyncStorage.setItem('authToken', validToken);
      await AsyncStorage.setItem('savedEmail', 'g@test.com');
      await AsyncStorage.setItem('savedPassword', 'pass');

      mockUserApi.getMyProfile.mockRejectedValueOnce({ response: { status: 401 } });
      mockAuthApi.login.mockResolvedValueOnce({
        data: { idToken: validToken, user: { uid: 'u1', username: 'Gamer', email: 'g@test.com' } },
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('sets unauthenticated when silent re-login also fails', async () => {
      await AsyncStorage.setItem('authToken', validToken);
      await AsyncStorage.setItem('savedEmail', 'g@test.com');
      await AsyncStorage.setItem('savedPassword', 'pass');

      mockUserApi.getMyProfile.mockRejectedValueOnce({ response: { status: 401 } });
      mockAuthApi.login.mockRejectedValueOnce(new Error('network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('does silent login when no token but credentials are saved', async () => {
      await AsyncStorage.setItem('savedEmail', 'g@test.com');
      await AsyncStorage.setItem('savedPassword', 'pass');

      mockAuthApi.login.mockResolvedValueOnce({
        data: { idToken: validToken, user: { uid: 'u1', username: 'Gamer', email: 'g@test.com' } },
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('clears invalid stored token and stays unauthenticated', async () => {
      await AsyncStorage.setItem('authToken', 'invalid.garbage.token');

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(await AsyncStorage.getItem('authToken')).toBeNull();
    });
  });

  describe('useAuth outside provider', () => {
    it('throws an error when used outside AuthProvider', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useAuth())).toThrow(
        'useAuth must be used within AuthProvider',
      );
      (console.error as jest.Mock).mockRestore();
    });
  });
});
