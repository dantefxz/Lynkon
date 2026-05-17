import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your machine's IP when running on Android emulator/device
// For Android Studio emulator use: http://10.0.2.2:3000
// For physical device use: http://<your-local-ip>:3000
export const API_BASE_URL = 'http://10.0.2.2:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject token on every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ──────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (email: string, password: string, username: string, birthDate: string) =>
    api.post('/auth/register', { email, password, username, birthDate }),
};

// ─── Users ─────────────────────────────────────────────
export const userApi = {
  getMyProfile: () => api.get('/users/me/profile'),

  searchUsers: (q: string) => api.get('/users/search', { params: { q } }),

  updateProfile: (userId: string, data: { username?: string; avatar?: string }) =>
    api.put(`/users/${userId}/profile`, data),

  changePassword: (userId: string, currentPassword: string, newPassword: string) =>
    api.put(`/users/${userId}/password`, { currentPassword, newPassword }),
};

// ─── Platforms ─────────────────────────────────────────
export const platformApi = {
  getSupportedPlatforms: () => api.get('/platforms/supported'),

  getLinkedPlatforms: () => api.get('/platforms/me'),

  linkPlatform: (platform: string, platformUserId: string) =>
    api.post('/platforms/me/link', { platform, platformUserId }),

  unlinkPlatform: (platform: string) => api.delete(`/platforms/me/${platform}`),

  getPlatformStats: (platform: string) => api.get(`/platforms/me/${platform}/stats`),

  getPlatformGames: (platform: string) => api.get(`/platforms/me/${platform}/games`),

  getPlatformAchievements: (platform: string) =>
    api.get(`/platforms/me/${platform}/achievements`),
};

// ─── Friends ───────────────────────────────────────────
export const friendApi = {
  getFriends: () => api.get('/friends'),

  sendFriendRequest: (targetUserId: string) =>
    api.post('/friends/request', { targetUserId }),

  acceptFriendRequest: (requestId: string) =>
    api.put(`/friends/request/${requestId}/accept`),
};

// ─── Messages ──────────────────────────────────────────
export const messageApi = {
  getConversation: (userId: string) => api.get(`/messages/${userId}`),

  sendMessage: (toUserId: string, message: string) =>
    api.post('/messages', { toUserId, message }),
};

export default api;
