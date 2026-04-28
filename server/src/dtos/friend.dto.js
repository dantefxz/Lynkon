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
 * @property {'accept'|'reject'} action
 */

const parseRespondFriendRequestDTO = (body) => {
  const errors = [];
  const { action } = body;

  if (!action) errors.push('action is required');
  else if (!['accept', 'reject'].includes(action))
    errors.push("action must be 'accept' or 'reject'");

  if (errors.length) return { data: null, errors };
  return { data: { action }, errors: [] };
};

/**
 * Serializa un perfil de usuario básico (para listas de amigos / solicitudes)
 */
const serializeBasicProfile = (userData) => ({
  uid:      userData.uid,
  username: userData.username,
  avatarId: userData.avatarId || null,
});

module.exports = { parseSendFriendRequestDTO, parseRespondFriendRequestDTO, serializeBasicProfile };
