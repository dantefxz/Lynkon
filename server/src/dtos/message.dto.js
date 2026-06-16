/**
 * DTOs de Message
 */

const MAX_TEXT_LENGTH = 2000;

/**
 * @typedef {Object} SendMessageDTO
 * @property {string} toUserId
 * @property {string} text      - Solo texto plano (sin imágenes ni audio per scope)
 */

const parseSendMessageDTO = (body) => {
  const errors = [];
  const { toUserId, text } = body;

  if (!toUserId) errors.push('toUserId is required');
  if (!text)     errors.push('text is required');
  else if (typeof text !== 'string' || text.trim().length === 0)
    errors.push('text cannot be empty');
  else if (text.length > MAX_TEXT_LENGTH)
    errors.push(`text cannot exceed ${MAX_TEXT_LENGTH} characters`);

  if (errors.length) return { data: null, errors };
  return { data: { toUserId, text: text.trim() }, errors: [] };
};

/**
 * @typedef {Object} MarkAsReadDTO
 * @property {string} friendId - Necesario para construir el conversationId
 */

const parseMarkAsReadDTO = (body) => {
  const errors = [];
  const { friendId } = body;

  if (!friendId) errors.push('friendId is required');

  if (errors.length) return { data: null, errors };
  return { data: { friendId }, errors: [] };
};

/**
 * @typedef {Object} DeleteConversationDTO
 * @property {string} friendId
 */

const parseDeleteConversationDTO = parseMarkAsReadDTO;

/**
 * Serializa un mensaje para la respuesta
 */
const serializeMessage = (docId, data) => ({
  messageId:  docId,
  fromUserId: data.fromUserId,
  text:       data.text,
  sentAt:     data.sentAt,
  read:       data.read,
});

module.exports = {
  parseSendMessageDTO,
  parseMarkAsReadDTO,
  parseDeleteConversationDTO,
  serializeMessage,
};
