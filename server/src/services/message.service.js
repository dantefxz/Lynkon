const { db } = require('../config/firebase');
const { serializeMessage } = require('../dtos/message.dto');
const { normalizeAvatarId } = require('../utils/avatar.utils');

const convId = (a, b) => [a, b].sort((x, y) => x.localeCompare(y)).join('_');

const getUnread = async (conversationId, uid) => {
  const snap = await db.collection('conversations').doc(conversationId).get();
  return snap.exists ? (snap.data()[`unread_${uid}`] || 0) : 0;
};

const getConversations = async (userId) => {
  const snap = await db.collection('conversations')
    .where('participants', 'array-contains', userId)
    .get();

  const conversations = await Promise.all(snap.docs.map(async (doc) => {
    const d        = doc.data();
    if (d[`deletedBy_${userId}`] && !(d[`unread_${userId}`] > 0)) return null;

    const otherUid  = d.participants.find((id) => id !== userId);
    const otherSnap = await db.collection('users').doc(otherUid).get();
    const other     = otherSnap.exists ? otherSnap.data() : null;

    return {
      conversationId: doc.id,
      with: other ? { uid: other.uid, username: other.username, avatarId: normalizeAvatarId(other.avatarId || other.avatar, other.uid) } : null,
      lastMessage:    d.lastMessage || '',
      lastMessageAt:  d.lastMessageAt,
      unreadCount:    d[`unread_${userId}`] || 0,
    };
  }));

  return conversations
    .filter((c) => c?.with)
    .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
    .slice(0, 50);
};

const getMessages = async (userId, friendId, limit = 50, before = null) => {
  const cid     = convId(userId, friendId);
  const convSnap = await db.collection('conversations').doc(cid).get();
  const deletedAt = convSnap.exists ? convSnap.data()[`deletedAt_${userId}`] : null;

  let query = db.collection('conversations').doc(cid)
    .collection('messages')
    .orderBy('sentAt', 'desc')
    .limit(Number(limit));

  if (before) query = query.startAfter(new Date(before));

  const snap = await query.get();
  return snap.docs
    .filter((d) => !deletedAt || d.data().sentAt > deletedAt)
    .map((d) => serializeMessage(d.id, d.data()))
    .reverse();
};

const sendMessage = async (userId, data) => {
  const userSnap = await db.collection('users').doc(userId).get();
  if (!(userSnap.data().friends || []).includes(data.toUserId))
    throw Object.assign(new Error('You can only message your friends'), { status: 403 });

  const cid = convId(userId, data.toUserId);
  const now = new Date().toISOString();
  const msg = { fromUserId: userId, text: data.text, sentAt: now, read: false };

  const batch  = db.batch();
  const msgRef = db.collection('conversations').doc(cid).collection('messages').doc();
  batch.set(msgRef, msg);

  const currentUnread = await getUnread(cid, data.toUserId);
  batch.set(db.collection('conversations').doc(cid), {
    participants:                [userId, data.toUserId],
    lastMessage:                 data.text.substring(0, 100),
    lastMessageAt:               now,
    [`unread_${data.toUserId}`]: currentUnread + 1,
  }, { merge: true });

  await batch.commit();
  return msgRef.id;
};

const markAsRead = async (userId, messageId, friendId) => {
  const cid = convId(userId, friendId);
  await db.collection('conversations').doc(cid).collection('messages').doc(messageId).update({ read: true });
  await db.collection('conversations').doc(cid).update({ [`unread_${userId}`]: 0 });
};

const markConversationRead = async (userId, friendId) => {
  const cid = convId(userId, friendId);
  const snap = await db.collection('conversations').doc(cid).get();
  if (!snap.exists) return;
  await db.collection('conversations').doc(cid).update({ [`unread_${userId}`]: 0 });
};

const deleteConversation = async (userId, friendId) => {
  const cid = convId(userId, friendId);
  await db.collection('conversations').doc(cid).update({
    [`deletedBy_${userId}`]: true,
    [`deletedAt_${userId}`]: new Date().toISOString(),
  });
};

module.exports = { getConversations, getMessages, sendMessage, markAsRead, markConversationRead, deleteConversation };
