import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject token on every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ──────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (email: string, password: string, username: string, birthDate: string) =>
    api.post('/auth/register', { email, password, username, birthDate }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  verifyResetCode: (email: string, code: string) =>
    api.post('/auth/verify-reset-code', { email, code }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, code, newPassword }),
};

// ─── Users ─────────────────────────────────────────────
export const userApi = {
  getMyProfile: () => api.get('/users/me/profile'),

  searchUsers: (q: string) => api.get('/users/search', { params: { q } }),

  updateProfile: (userId: string, data: { username?: string; avatarId?: string }) =>
    api.patch(`/users/${userId}/profile`, data),

  changePassword: (userId: string, currentPassword: string, newPassword: string) =>
    api.put(`/users/${userId}/password`, { currentPassword, newPassword }),

  // ── Favoritos ──────────────────────────────────────
  getFavorites: (userId: string) =>
    api.get(`/users/${userId}/favorites`),

  addFavorite: (userId: string, gameId: string, name: string, platform: string) =>
    api.post(`/users/${userId}/favorites`, { gameId, name, platform }),

  removeFavorite: (userId: string, gameId: string, platform?: string) =>
    api.delete(`/users/${userId}/favorites/${gameId}`, { params: platform ? { platform } : {} }),

  // ── Juegos del perfil ──────────────────────────────
  getProfileGames: (userId: string) =>
    api.get(`/users/${userId}/profile-games`),

  addProfileGame: (userId: string, gameId: string, name: string, platform: string, cover?: string | null, playtimeHours?: number) =>
    api.post(`/users/${userId}/profile-games`, { gameId, name, platform, cover, playtimeHours }),

  removeProfileGame: (userId: string, gameId: string, platform?: string) =>
    api.delete(`/users/${userId}/profile-games/${gameId}`, { params: platform ? { platform } : {} }),
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

  // ── OAuth / vinculación real ───────────────────────
  initPlatformAuth: (platform: 'steam' | 'xbox', redirectUri?: string) =>
    api.post(`/platforms/auth/${platform}/init`, { redirectUri }),

  // ── Visibilidad de juegos ──────────────────────────
  getGameVisibility: () => api.get('/platforms/me/visibility'),

  toggleGameVisibility: (platform: string, gameId: string) =>
    api.patch(`/platforms/me/${platform}/games/${gameId}/visibility`),

  getGameAchievements: (platform: string, gameId: string) =>
    api.get(`/platforms/me/${platform}/games/${gameId}/achievements`),
};

// ─── Friends ───────────────────────────────────────────
export const friendApi = {
  getFriends: () => api.get('/friends/me'),

  getFriendRequests: () => api.get('/friends/me/requests'),

  sendFriendRequest: (targetUserId: string) =>
    api.post('/friends/me/requests', { targetUserId }),

  respondToRequest: (requestId: string, action: boolean) =>
    api.patch(`/friends/me/requests/${requestId}`, { action }),

  removeFriend: (friendId: string) => api.delete(`/friends/me/${friendId}`),
};

// ─── Messages ──────────────────────────────────────────
export const messageApi = {
  getConversations: () => api.get('/messages/me'),

  getMessages: (friendId: string) => api.get(`/messages/me/${friendId}`),

  sendMessage: (toUserId: string, message: string) =>
    api.post('/messages/me', { toUserId, message }),

  deleteConversation: (friendId: string) => api.delete('/messages/me'),

  markAsRead: (messageId: string) => api.patch(`/messages/me/${messageId}`),
};

export default api;
