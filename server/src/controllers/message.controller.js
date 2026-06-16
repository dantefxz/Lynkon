const {
  parseSendMessageDTO,
  parseMarkAsReadDTO,
  parseDeleteConversationDTO,
} = require('../dtos/message.dto');
const messageService = require('../services/message.service');

const getConversations = async (req, res, next) => {
  try {
    const conversations = await messageService.getConversations(req.user.uid);
    return res.status(200).json({ conversations });
  } catch (err) { next(err); }
};

const getMessages = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const { limit, before } = req.query;
    const messages = await messageService.getMessages(req.user.uid, friendId, limit, before);
    return res.status(200).json({ messages });
  } catch (err) { next(err); }
};

const sendMessage = async (req, res, next) => {
  try {
    const { data, errors } = parseSendMessageDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const messageId = await messageService.sendMessage(req.user.uid, data);
    return res.status(201).json({ message: 'Message sent', messageId });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const markConversationRead = async (req, res, next) => {
  try {
    await messageService.markConversationRead(req.user.uid, req.params.friendId);
    return res.status(200).json({ message: 'Conversation marked as read' });
  } catch (err) { next(err); }
};

const markAsRead = async (req, res, next) => {
  try {
    const { data, errors } = parseMarkAsReadDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    await messageService.markAsRead(req.user.uid, req.params.messageId, data.friendId);
    return res.status(200).json({ message: 'Marked as read' });
  } catch (err) { next(err); }
};

const deleteConversation = async (req, res, next) => {
  try {
    const { data, errors } = parseDeleteConversationDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    await messageService.deleteConversation(req.user.uid, data.friendId);
    return res.status(200).json({ message: 'Conversation deleted' });
  } catch (err) { next(err); }
};

module.exports = { getConversations, getMessages, sendMessage, markAsRead, markConversationRead, deleteConversation };
