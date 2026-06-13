/**
 * DTOs de Friend
 */

/**
 * @typedef {Object} SendFriendRequestDTO
 * @property {string} targetUserId
 */

const parseSendFriendRequestDTO = (body, senderUid) => {
  const errors = [];
  const { targetUserId } = body;

  if (!targetUserId) errors.push('targetUserId is required');
  else if (targetUserId === senderUid) errors.push('Cannot send a friend request to yourself');

  if (errors.length) return { data: null, errors };
  return { data: { targetUserId }, errors: [] };
};

/**
 * @typedef {Object} RespondFriendRequestDTO
 * @property {true|false} action
 */

const { normalizeAvatarId } = require('../utils/avatar.utils');

const parseRespondFriendRequestDTO = (body) => {
  const errors = [];
  const { action } = body;

  if (action === undefined || action === null) errors.push('action is required');
  else if (typeof action !== 'boolean') errors.push('action must be a boolean');

  if (errors.length) return { data: null, errors };
  return { data: { action }, errors: [] };
};

/**
 * Serializa un perfil de usuario básico (para listas de amigos / solicitudes)
 */
const serializeBasicProfile = (userData) => ({
  uid:      userData.uid,
  username: userData.username,
  avatarId: normalizeAvatarId(userData.avatarId || userData.avatar, userData.uid),
});

module.exports = { parseSendFriendRequestDTO, parseRespondFriendRequestDTO, serializeBasicProfile };
