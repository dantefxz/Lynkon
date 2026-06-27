// All mock functions live inside the factory to avoid babel hoisting issues
jest.mock('axios', () => {
  const interceptorUse = jest.fn();
  const instance = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: interceptorUse },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: { create: jest.fn(() => instance) },
    create: jest.fn(() => instance),
  };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { hostUri: '' } },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { authApi, userApi, platformApi, friendApi, messageApi } from '@/services/api';

// Retrieve the mock instance created by axios.create() when api.ts loaded
// `axios` IS the default export, so axios.create is the mock fn directly
function getMock() {
  const createFn = (axios as any).create as jest.Mock;
  return createFn.mock.results[0].value as {
    get: jest.Mock;
    post: jest.Mock;
    patch: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
  };
}

beforeEach(() => {
  const m = getMock();
  m.get.mockReset().mockResolvedValue({ data: {} });
  m.post.mockReset().mockResolvedValue({ data: {} });
  m.patch.mockReset().mockResolvedValue({ data: {} });
  m.put.mockReset().mockResolvedValue({ data: {} });
  m.delete.mockReset().mockResolvedValue({ data: {} });
});

describe('authApi', () => {
  it('login posts to /auth/login with email and password', async () => {
    await authApi.login('user@test.com', 'pass123');
    expect(getMock().post).toHaveBeenCalledWith('/auth/login', {
      email: 'user@test.com',
      password: 'pass123',
    });
  });

  it('register posts to /auth/register with all fields', async () => {
    await authApi.register('u@test.com', 'pw', 'Gamer', '2000-01-01');
    expect(getMock().post).toHaveBeenCalledWith('/auth/register', {
      email: 'u@test.com',
      password: 'pw',
      username: 'Gamer',
      birthDate: '2000-01-01',
    });
  });

  it('forgotPassword posts to /auth/forgot-password', async () => {
    await authApi.forgotPassword('u@test.com');
    expect(getMock().post).toHaveBeenCalledWith('/auth/forgot-password', {
      email: 'u@test.com',
    });
  });

  it('verifyResetCode posts to /auth/verify-reset-code', async () => {
    await authApi.verifyResetCode('u@test.com', '123456');
    expect(getMock().post).toHaveBeenCalledWith('/auth/verify-reset-code', {
      email: 'u@test.com',
      code: '123456',
    });
  });

  it('resetPassword posts to /auth/reset-password', async () => {
    await authApi.resetPassword('u@test.com', '123456', 'newPass');
    expect(getMock().post).toHaveBeenCalledWith('/auth/reset-password', {
      email: 'u@test.com',
      code: '123456',
      newPassword: 'newPass',
    });
  });
});

describe('userApi', () => {
  it('getMyProfile gets /users/me/profile', async () => {
    await userApi.getMyProfile();
    expect(getMock().get).toHaveBeenCalledWith('/users/me/profile');
  });

  it('getProfile gets /users/:id/profile', async () => {
    await userApi.getProfile('user42');
    expect(getMock().get).toHaveBeenCalledWith('/users/user42/profile');
  });

  it('searchUsers gets /users/search with query param', async () => {
    await userApi.searchUsers('gamer');
    expect(getMock().get).toHaveBeenCalledWith('/users/search', { params: { q: 'gamer' } });
  });

  it('updateProfile patches /users/:id/profile', async () => {
    await userApi.updateProfile('u1', { username: 'NewName' });
    expect(getMock().patch).toHaveBeenCalledWith('/users/u1/profile', { username: 'NewName' });
  });

  it('changePassword puts /users/:id/password', async () => {
    await userApi.changePassword('u1', 'old', 'new');
    expect(getMock().put).toHaveBeenCalledWith('/users/u1/password', {
      currentPassword: 'old',
      newPassword: 'new',
    });
  });

  it('getFavorites gets /users/:id/favorites', async () => {
    await userApi.getFavorites('u1');
    expect(getMock().get).toHaveBeenCalledWith('/users/u1/favorites');
  });

  it('addFavorite posts to /users/:id/favorites', async () => {
    await userApi.addFavorite('u1', 'g1', 'Halo', 'xbox', null, 10);
    expect(getMock().post).toHaveBeenCalledWith('/users/u1/favorites', {
      gameId: 'g1',
      name: 'Halo',
      platform: 'xbox',
      cover: null,
      playtimeHours: 10,
    });
  });

  it('removeFavorite deletes /users/:id/favorites/:gameId', async () => {
    await userApi.removeFavorite('u1', 'g1', 'steam');
    expect(getMock().delete).toHaveBeenCalledWith('/users/u1/favorites/g1', {
      params: { platform: 'steam' },
    });
  });

  it('setStatus patches /users/me/status', async () => {
    await userApi.setStatus(true);
    expect(getMock().patch).toHaveBeenCalledWith('/users/me/status', { isOnline: true });
  });

  it('deleteAccount deletes /users/:id with password in body', async () => {
    await userApi.deleteAccount('u1', 'mypassword');
    expect(getMock().delete).toHaveBeenCalledWith('/users/u1', {
      data: { password: 'mypassword' },
    });
  });
});

describe('platformApi', () => {
  it('getSupportedPlatforms gets /platforms/supported', async () => {
    await platformApi.getSupportedPlatforms();
    expect(getMock().get).toHaveBeenCalledWith('/platforms/supported');
  });

  it('getLinkedPlatforms gets /platforms/me', async () => {
    await platformApi.getLinkedPlatforms();
    expect(getMock().get).toHaveBeenCalledWith('/platforms/me');
  });

  it('linkPlatform posts to /platforms/me/link', async () => {
    await platformApi.linkPlatform('steam', 'steamUser123');
    expect(getMock().post).toHaveBeenCalledWith('/platforms/me/link', {
      platform: 'steam',
      platformUserId: 'steamUser123',
    });
  });

  it('unlinkPlatform deletes /platforms/me/:platform', async () => {
    await platformApi.unlinkPlatform('xbox');
    expect(getMock().delete).toHaveBeenCalledWith('/platforms/me/xbox');
  });

  it('syncPlatform posts to /platforms/me/:platform/sync', async () => {
    await platformApi.syncPlatform('steam');
    expect(getMock().post).toHaveBeenCalledWith('/platforms/me/steam/sync');
  });
});

describe('friendApi', () => {
  it('getFriends gets /friends/me', async () => {
    await friendApi.getFriends();
    expect(getMock().get).toHaveBeenCalledWith('/friends/me');
  });

  it('sendFriendRequest posts to /friends/me/requests', async () => {
    await friendApi.sendFriendRequest('user99');
    expect(getMock().post).toHaveBeenCalledWith('/friends/me/requests', {
      targetUserId: 'user99',
    });
  });

  it('respondToRequest patches /friends/me/requests/:id', async () => {
    await friendApi.respondToRequest('req1', true);
    expect(getMock().patch).toHaveBeenCalledWith('/friends/me/requests/req1', { action: true });
  });

  it('removeFriend deletes /friends/me/:id', async () => {
    await friendApi.removeFriend('friend1');
    expect(getMock().delete).toHaveBeenCalledWith('/friends/me/friend1');
  });

  it('cancelSentRequest deletes /friends/me/requests/sent/:id', async () => {
    await friendApi.cancelSentRequest('req2');
    expect(getMock().delete).toHaveBeenCalledWith('/friends/me/requests/sent/req2');
  });
});

describe('request interceptor', () => {
  it('adds Authorization header when token exists in AsyncStorage', async () => {
    await AsyncStorage.setItem('authToken', 'test-token-xyz');
    const mock = getMock() as any;
    const interceptorFn = mock.interceptors.request.use.mock.calls[0][0];
    const config = { headers: {} as any };
    const result = await interceptorFn(config);
    expect(result.headers.Authorization).toBe('Bearer test-token-xyz');
    await AsyncStorage.removeItem('authToken');
  });

  it('does not add Authorization header when no token', async () => {
    const mock = getMock() as any;
    const interceptorFn = mock.interceptors.request.use.mock.calls[0][0];
    const config = { headers: {} as any };
    const result = await interceptorFn(config);
    expect(result.headers.Authorization).toBeUndefined();
  });
});

describe('userApi (extended)', () => {
  it('getRecommendations gets /users/:id/recommendations', async () => {
    await userApi.getRecommendations('u1');
    expect(getMock().get).toHaveBeenCalledWith('/users/u1/recommendations');
  });

  it('getProfileGames gets /users/:id/profile-games', async () => {
    await userApi.getProfileGames('u1');
    expect(getMock().get).toHaveBeenCalledWith('/users/u1/profile-games');
  });

  it('addProfileGame posts to /users/:id/profile-games', async () => {
    await userApi.addProfileGame('u1', 'g1', 'Halo', 'xbox', 'http://img.jpg', 20);
    expect(getMock().post).toHaveBeenCalledWith('/users/u1/profile-games', {
      gameId: 'g1',
      name: 'Halo',
      platform: 'xbox',
      cover: 'http://img.jpg',
      playtimeHours: 20,
    });
  });

  it('removeProfileGame deletes /users/:id/profile-games/:gameId with platform', async () => {
    await userApi.removeProfileGame('u1', 'g1', 'steam');
    expect(getMock().delete).toHaveBeenCalledWith('/users/u1/profile-games/g1', {
      params: { platform: 'steam' },
    });
  });

  it('removeProfileGame deletes with empty params when no platform', async () => {
    await userApi.removeProfileGame('u1', 'g1');
    expect(getMock().delete).toHaveBeenCalledWith('/users/u1/profile-games/g1', {
      params: {},
    });
  });

  it('removeFavorite deletes with empty params when no platform', async () => {
    await userApi.removeFavorite('u1', 'g1');
    expect(getMock().delete).toHaveBeenCalledWith('/users/u1/favorites/g1', {
      params: {},
    });
  });

  it('getUserGameAchievements gets correct path', async () => {
    await userApi.getUserGameAchievements('u1', 'steam', 'g1');
    expect(getMock().get).toHaveBeenCalledWith('/users/u1/platforms/steam/games/g1/achievements');
  });

  it('setSkillTag patches /users/:id/skills/:gameId', async () => {
    await userApi.setSkillTag('u1', 'g1', 'advanced');
    expect(getMock().patch).toHaveBeenCalledWith('/users/u1/skills/g1', { level: 'advanced' });
  });

  it('setSkillTag patches with null level', async () => {
    await userApi.setSkillTag('u1', 'g1', null);
    expect(getMock().patch).toHaveBeenCalledWith('/users/u1/skills/g1', { level: null });
  });
});

describe('platformApi (extended)', () => {
  it('getPlatformStats gets /platforms/me/:platform/stats', async () => {
    await platformApi.getPlatformStats('steam');
    expect(getMock().get).toHaveBeenCalledWith('/platforms/me/steam/stats');
  });

  it('getPlatformGames gets /platforms/me/:platform/games', async () => {
    await platformApi.getPlatformGames('xbox');
    expect(getMock().get).toHaveBeenCalledWith('/platforms/me/xbox/games');
  });

  it('getPlatformAchievements gets /platforms/me/:platform/achievements', async () => {
    await platformApi.getPlatformAchievements('steam');
    expect(getMock().get).toHaveBeenCalledWith('/platforms/me/steam/achievements');
  });

  it('initPlatformAuth posts to /platforms/auth/:platform/init', async () => {
    await platformApi.initPlatformAuth('steam', 'http://redirect.com');
    expect(getMock().post).toHaveBeenCalledWith('/platforms/auth/steam/init', {
      redirectUri: 'http://redirect.com',
    });
  });

  it('getGameVisibility gets /platforms/me/visibility', async () => {
    await platformApi.getGameVisibility();
    expect(getMock().get).toHaveBeenCalledWith('/platforms/me/visibility');
  });

  it('toggleGameVisibility patches visibility', async () => {
    await platformApi.toggleGameVisibility('steam', 'g1');
    expect(getMock().patch).toHaveBeenCalledWith('/platforms/me/steam/games/g1/visibility');
  });

  it('getGameAchievements gets achievements for a game', async () => {
    await platformApi.getGameAchievements('steam', 'g1');
    expect(getMock().get).toHaveBeenCalledWith('/platforms/me/steam/games/g1/achievements');
  });
});

describe('friendApi (extended)', () => {
  it('getFriendRequests gets /friends/me/requests', async () => {
    await friendApi.getFriendRequests();
    expect(getMock().get).toHaveBeenCalledWith('/friends/me/requests');
  });

  it('getSentRequests gets /friends/me/requests/sent', async () => {
    await friendApi.getSentRequests();
    expect(getMock().get).toHaveBeenCalledWith('/friends/me/requests/sent');
  });
});

describe('messageApi', () => {
  it('getConversations gets /messages/me', async () => {
    await messageApi.getConversations();
    expect(getMock().get).toHaveBeenCalledWith('/messages/me');
  });

  it('getMessages gets /messages/me/:friendId', async () => {
    await messageApi.getMessages('friend1');
    expect(getMock().get).toHaveBeenCalledWith('/messages/me/friend1');
  });

  it('sendMessage posts to /messages/me', async () => {
    await messageApi.sendMessage('friend1', 'Hello!');
    expect(getMock().post).toHaveBeenCalledWith('/messages/me', {
      toUserId: 'friend1',
      text: 'Hello!',
    });
  });

  it('markConversationRead patches /messages/me/:friendId/read', async () => {
    await messageApi.markConversationRead('friend1');
    expect(getMock().patch).toHaveBeenCalledWith('/messages/me/friend1/read');
  });

  it('markAsRead patches /messages/me/:messageId', async () => {
    await messageApi.markAsRead('msg1');
    expect(getMock().patch).toHaveBeenCalledWith('/messages/me/msg1');
  });

  it('deleteConversation deletes /messages/me with friendId in body', async () => {
    await messageApi.deleteConversation('friend1');
    expect(getMock().delete).toHaveBeenCalledWith('/messages/me', {
      data: { friendId: 'friend1' },
    });
  });
});
