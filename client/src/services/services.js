// src/services/user.service.js
import api from './api';

export const userService = {
  getMyProfile:      ()          => api.get('/users/me/profile').then(r => r.data.profile),
  getProfile:        (id)        => api.get(`/users/${id}/profile`).then(r => r.data.profile),
  updateProfile:     (id, data)  => api.patch(`/users/${id}/profile`, data).then(r => r.data),
  getSettings:       (id)        => api.get(`/users/${id}/settings`).then(r => r.data.settings),
  updateSettings:    (id, data)  => api.patch(`/users/${id}/settings`, data).then(r => r.data),
  searchUsers:       (q)         => api.get(`/users/search?q=${q}`).then(r => r.data.users),
  getRecommendations:(id)        => api.get(`/users/${id}/recommendations`).then(r => r.data.recommendations),
  deleteUser:        (id)        => api.delete(`/users/${id}`).then(r => r.data),
};

// src/services/platform.service.js
export const platformService = {
  getSupported:      ()                   => api.get('/platforms/supported').then(r => r.data.platforms),
  getLinked:         (userId)             => api.get(`/platforms/${userId}`).then(r => r.data.platforms),
  link:              (userId, data)       => api.post(`/platforms/${userId}/link`, data).then(r => r.data),
  unlink:            (userId, platform)   => api.delete(`/platforms/${userId}/${platform}`).then(r => r.data),
  getStats:          (userId, platform)   => api.get(`/platforms/${userId}/${platform}/stats`).then(r => r.data),
  getGames:          (userId, platform)   => api.get(`/platforms/${userId}/${platform}/games`).then(r => r.data.games),
  getAchievements:   (userId, platform)   => api.get(`/platforms/${userId}/${platform}/achievements`).then(r => r.data),
};

// src/services/friend.service.js
export const friendService = {
  getFriends:        (userId)           => api.get(`/friends/${userId}`).then(r => r.data.friends),
  getRequests:       (userId)           => api.get(`/friends/${userId}/requests`).then(r => r.data.requests),
  sendRequest:       (userId, targetId) => api.post(`/friends/${userId}/requests`, { targetUserId: targetId }).then(r => r.data),
  respondRequest:    (userId, reqId, action) => api.patch(`/friends/${userId}/requests/${reqId}`, { action }).then(r => r.data),
  removeFriend:      (userId, friendId) => api.delete(`/friends/${userId}/${friendId}`).then(r => r.data),
};

// src/services/message.service.js
export const messageService = {
  getConversations:  (userId)              => api.get(`/messages/${userId}`).then(r => r.data.conversations),
  getMessages:       (userId, friendId)    => api.get(`/messages/${userId}/${friendId}`).then(r => r.data.messages),
  send:              (userId, toUserId, text) => api.post(`/messages/${userId}`, { toUserId, text }).then(r => r.data),
  markRead:          (userId, msgId, friendId) => api.patch(`/messages/${userId}/${msgId}`, { friendId }).then(r => r.data),
  deleteConversation:(userId, friendId)    => api.delete(`/messages/${userId}`, { data: { friendId } }).then(r => r.data),
};
