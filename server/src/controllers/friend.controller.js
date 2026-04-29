const { db } = require('../config/firebase');
const {
  parseSendFriendRequestDTO,
  parseRespondFriendRequestDTO,
  serializeBasicProfile,
} = require('../dtos/friend.dto');

const getProfile = async (uid) => {
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? snap.data() : null;
};

// ─── GET friends ─────────────────────────────────────────────────────────────

const getFriends = async (req, res, next) => {
  try {
    const snap = await db.collection('users').doc(req.user.uid).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });

    const friendIds = snap.data().friends || [];
    const profiles  = await Promise.all(friendIds.map(getProfile));

    return res.status(200).json({
      friends: profiles.filter(Boolean).map(serializeBasicProfile),
    });
  } catch (err) { next(err); }
};

// ─── GET friend requests ──────────────────────────────────────────────────────

const getFriendRequests = async (req, res, next) => {
  try {
    const snap = await db.collection('friendRequests')
      .where('toUserId', '==', req.user.uid)
      .where('status', '==', 'pending')
      .get();

    const requests = await Promise.all(snap.docs.map(async (doc) => {
      const d    = doc.data();
      const from = await getProfile(d.fromUserId);
      return {
        requestId: doc.id,
        from: from ? serializeBasicProfile(from) : null,
        sentAt: d.sentAt,
      };
    }));

    return res.status(200).json({ requests: requests.filter((r) => r.from) });
  } catch (err) { next(err); }
};

// ─── POST send request ────────────────────────────────────────────────────────

const sendFriendRequest = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { data, errors } = parseSendFriendRequestDTO(req.body, userId);
    if (errors.length) return res.status(400).json({ errors });

    const targetSnap = await db.collection('users').doc(data.targetUserId).get();
    if (!targetSnap.exists) return res.status(404).json({ error: 'Target user not found' });

    const userSnap = await db.collection('users').doc(userId).get();
    if ((userSnap.data().friends || []).includes(data.targetUserId))
      return res.status(409).json({ error: 'Already friends' });

    const existing = await db.collection('friendRequests')
      .where('fromUserId', '==', userId)
      .where('toUserId',   '==', data.targetUserId)
      .where('status',     '==', 'pending')
      .get();
    if (!existing.empty) return res.status(409).json({ error: 'Friend request already sent' });

    const ref = await db.collection('friendRequests').add({
      fromUserId: userId,
      toUserId:   data.targetUserId,
      status:     'pending',
      sentAt:     new Date().toISOString(),
    });

    return res.status(201).json({ message: 'Friend request sent', requestId: ref.id });
  } catch (err) { next(err); }
};

// ─── PATCH respond to request ─────────────────────────────────────────────────

const respondToRequest = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { requestId } = req.params;
    const { data, errors } = parseRespondFriendRequestDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const reqSnap = await db.collection('friendRequests').doc(requestId).get();
    if (!reqSnap.exists) return res.status(404).json({ error: 'Request not found' });

    const reqData = reqSnap.data();
    if (reqData.toUserId !== userId)  return res.status(403).json({ error: 'This request was not sent to you' });
    if (reqData.status !== 'pending') return res.status(409).json({ error: 'Request already processed' });

    await db.collection('friendRequests').doc(requestId).update({
      status: data.action === true ? 'accepted' : 'rejected',
      respondedAt: new Date().toISOString(),
    });

    if (data.action === true) {
      const [userSnap, fromSnap] = await Promise.all([
        db.collection('users').doc(userId).get(),
        db.collection('users').doc(reqData.fromUserId).get(),
      ]);
      const batch = db.batch();
      batch.update(db.collection('users').doc(userId), {
        friends: [...(userSnap.data().friends || []), reqData.fromUserId],
      });
      batch.update(db.collection('users').doc(reqData.fromUserId), {
        friends: [...(fromSnap.data().friends || []), userId],
      });
      await batch.commit();
    }

    return res.status(200).json({ message: `Friend request ${data.action}ed` });
  } catch (err) { next(err); }
};

// ─── DELETE remove friend ─────────────────────────────────────────────────────

const removeFriend = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { friendId } = req.params;
    const [userSnap, friendSnap] = await Promise.all([
      db.collection('users').doc(userId).get(),
      db.collection('users').doc(friendId).get(),
    ]);

    // ← validación que faltaba
    const userFriends = userSnap.data().friends || [];
    if (!userFriends.includes(friendId))
      return res.status(404).json({ error: 'This user is not your friend' });

    const batch = db.batch();
    batch.update(db.collection('users').doc(userId), {
      friends: userFriends.filter((id) => id !== friendId),
    });
    if (friendSnap.exists) {
      batch.update(db.collection('users').doc(friendId), {
        friends: (friendSnap.data().friends || []).filter((id) => id !== userId),
      });
    }
    await batch.commit();

    return res.status(200).json({ message: 'Friend removed' });
  } catch (err) { next(err); }
};

module.exports = { getFriends, getFriendRequests, sendFriendRequest, respondToRequest, removeFriend };
