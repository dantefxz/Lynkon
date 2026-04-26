const { db } = require('../config/firebase');
const {
  parseSendMessageDTO,
  parseMarkAsReadDTO,
  parseDeleteConversationDTO,
  serializeMessage,
} = require('../dtos/message.dto');

/** ID de conversación determinístico a partir de dos UIDs */
const convId = (a, b) => [a, b].sort().join('_');

const getUnread = async (conversationId, uid) => {
  const snap = await db.collection('conversations').doc(conversationId).get();
  return snap.exists ? (snap.data()[`unread_${uid}`] || 0) : 0;
};

// ─── GET conversations ────────────────────────────────────────────────────────

const getConversations = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const snap = await db.collection('conversations')
      .where('participants', 'array-contains', userId)
      .orderBy('lastMessageAt', 'desc')
      .limit(50).get();

    const conversations = await Promise.all(snap.docs.map(async (doc) => {
      const d           = doc.data();
      const otherUid    = d.participants.find((id) => id !== userId);
      const otherSnap   = await db.collection('users').doc(otherUid).get();
      const other       = otherSnap.exists ? otherSnap.data() : null;

      // Excluir conversaciones borradas por este usuario
      if (d[`deletedBy_${userId}`]) return null;

      return {
        conversationId: doc.id,
        with: other ? { uid: other.uid, username: other.username, avatarId: other.avatarId } : null,
        lastMessage:    d.lastMessage || '',
        lastMessageAt:  d.lastMessageAt,
        unreadCount:    d[`unread_${userId}`] || 0,
      };
    }));

    return res.status(200).json({
      conversations: conversations.filter((c) => c && c.with),
    });
  } catch (err) { next(err); }
};

// ─── GET messages ─────────────────────────────────────────────────────────────

const getMessages = async (req, res, next) => {
  try {
    const { userId, friendId } = req.params;
    const { limit = 50, before } = req.query;

    let query = db.collection('conversations').doc(convId(userId, friendId))
      .collection('messages')
      .orderBy('sentAt', 'desc')
      .limit(Number(limit));

    if (before) query = query.startAfter(new Date(before));

    const snap     = await query.get();
    const messages = snap.docs.map((d) => serializeMessage(d.id, d.data())).reverse();

    return res.status(200).json({ messages });
  } catch (err) { next(err); }
};

// ─── POST send message ────────────────────────────────────────────────────────

const sendMessage = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { data, errors } = parseSendMessageDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    // Solo amigos pueden mandarse mensajes
    const userSnap = await db.collection('users').doc(userId).get();
    if (!(userSnap.data().friends || []).includes(data.toUserId))
      return res.status(403).json({ error: 'You can only message your friends' });

    const cid  = convId(userId, data.toUserId);
    const now  = new Date().toISOString();
    const msg  = { fromUserId: userId, text: data.text, sentAt: now, read: false };

    const batch    = db.batch();
    const msgRef   = db.collection('conversations').doc(cid).collection('messages').doc();
    batch.set(msgRef, msg);

    const currentUnread = await getUnread(cid, data.toUserId);
    batch.set(db.collection('conversations').doc(cid), {
      participants:           [userId, data.toUserId],
      lastMessage:            data.text.substring(0, 100),
      lastMessageAt:          now,
      [`unread_${data.toUserId}`]: currentUnread + 1,
    }, { merge: true });

    await batch.commit();
    return res.status(201).json({ message: 'Message sent', messageId: msgRef.id });
  } catch (err) { next(err); }
};

// ─── PATCH mark as read ───────────────────────────────────────────────────────

const markAsRead = async (req, res, next) => {
  try {
    const { userId, messageId } = req.params;
    const { data, errors } = parseMarkAsReadDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const cid = convId(userId, data.friendId);
    await db.collection('conversations').doc(cid).collection('messages').doc(messageId).update({ read: true });
    await db.collection('conversations').doc(cid).update({ [`unread_${userId}`]: 0 });

    return res.status(200).json({ message: 'Marked as read' });
  } catch (err) { next(err); }
};

// ─── DELETE conversation ──────────────────────────────────────────────────────

const deleteConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { data, errors } = parseDeleteConversationDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const cid = convId(userId, data.friendId);
    await db.collection('conversations').doc(cid).update({
      [`deletedBy_${userId}`]:  true,
      [`deletedAt_${userId}`]:  new Date().toISOString(),
    });

    return res.status(200).json({ message: 'Conversation deleted' });
  } catch (err) { next(err); }
};

module.exports = { getConversations, getMessages, sendMessage, markAsRead, deleteConversation };
