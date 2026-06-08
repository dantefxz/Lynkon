import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.46:8081';

async function getHeaders() {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method: string, path: string, body?: object) {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { response: { data, status: res.status } };
  return { data, status: res.status };
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  forgotPassword: (email: string) =>
    request('POST', '/auth/forgot-password', { email }),
  verifyResetCode: (email: string, code: string) =>
    request('POST', '/auth/verify-reset-code', { email, code }),
  resetPassword: (email: string, code: string, password: string) =>
    request('POST', '/auth/reset-password', { email, code, password }),
};

// ─── User ────────────────────────────────────────────────────────────────────
export const userApi = {
  updateProfile: (userId: string, data: { username?: string; avatar?: string }) =>
    request('PUT', `/users/${userId}`, data),
  changePassword: (userId: string, data: { currentPassword: string; newPassword: string }) =>
    request('PUT', `/users/${userId}/password`, data),
  getFavorites: (userId: string) =>
    request('GET', `/users/${userId}/favorites`),
  addFavorite: (userId: string, gameId: string) =>
    request('POST', `/users/${userId}/favorites`, { gameId }),
  removeFavorite: (userId: string, gameId: string) =>
    request('DELETE', `/users/${userId}/favorites/${gameId}`),
  searchUsers: (query: string) =>
    request('GET', `/users/search?q=${encodeURIComponent(query)}`),
};

// ─── Platform ────────────────────────────────────────────────────────────────
export const platformApi = {
  getLinkedPlatforms: () =>
    request('GET', '/platforms'),
  linkPlatform: (platform: string, credentials: object) =>
    request('POST', `/platforms/${platform}/link`, credentials),
  unlinkPlatform: (platform: string) =>
    request('DELETE', `/platforms/${platform}`),
  getPlatformGames: (platform: string) =>
    request('GET', `/platforms/${platform}/games`),
  getPlatformStats: (platform: string) =>
    request('GET', `/platforms/${platform}/stats`),
  getGameVisibility: (gameId: string) =>
    request('GET', `/games/${gameId}/visibility`),
};

// ─── Friends ─────────────────────────────────────────────────────────────────
export const friendApi = {
  getFriends: () =>
    request('GET', '/friends'),
  getFriendRequests: () =>
    request('GET', '/friends/requests'),
  sendFriendRequest: (userId: string) =>
    request('POST', '/friends/request', { userId }),
};

// ─── Messages ────────────────────────────────────────────────────────────────
export const messageApi = {
  getMessages: (userId: string) =>
    request('GET', `/messages/${userId}`),
  sendMessage: (userId: string, message: string) =>
    request('POST', `/messages/${userId}`, { message }),
};
