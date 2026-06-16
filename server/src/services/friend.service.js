const { db } = require('../config/firebase');
const { serializeBasicProfile } = require('../dtos/friend.dto');

const getProfile = async (uid) => {
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? snap.data() : null;
};

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutos

const getFriends = async (userId) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });

  const friendIds = snap.data().friends || [];
  const profiles  = await Promise.all(friendIds.map(getProfile));
  const now = Date.now();
  return profiles.filter(Boolean).map((p) => ({
    ...serializeBasicProfile(p),
    isOnline: p.isOnline === true
      && !!p.lastSeen
      && (now - new Date(p.lastSeen).getTime()) < ONLINE_THRESHOLD_MS,
  }));
};

const getFriendRequests = async (userId) => {
  const snap = await db.collection('friendRequests')
    .where('toUserId', '==', userId)
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

  return requests.filter((r) => r.from);
};

const sendFriendRequest = async (userId, targetUserId) => {
  const targetSnap = await db.collection('users').doc(targetUserId).get();
  if (!targetSnap.exists) throw Object.assign(new Error('Target user not found'), { status: 404 });

  const userSnap = await db.collection('users').doc(userId).get();
  if ((userSnap.data().friends || []).includes(targetUserId))
    throw Object.assign(new Error('Already friends'), { status: 409 });

  const existing = await db.collection('friendRequests')
    .where('fromUserId', '==', userId)
    .where('toUserId',   '==', targetUserId)
    .where('status',     '==', 'pending')
    .get();
  if (!existing.empty) throw Object.assign(new Error('Friend request already sent'), { status: 409 });

  const ref = await db.collection('friendRequests').add({
    fromUserId: userId,
    toUserId:   targetUserId,
    status:     'pending',
    sentAt:     new Date().toISOString(),
  });

  return ref.id;
};

const respondToRequest = async (userId, requestId, action) => {
  const reqSnap = await db.collection('friendRequests').doc(requestId).get();
  if (!reqSnap.exists) throw Object.assign(new Error('Request not found'), { status: 404 });

  const reqData = reqSnap.data();
  if (reqData.toUserId !== userId)  throw Object.assign(new Error('This request was not sent to you'), { status: 403 });
  if (reqData.status !== 'pending') throw Object.assign(new Error('Request already processed'), { status: 409 });

  await db.collection('friendRequests').doc(requestId).update({
    status:      action ? 'accepted' : 'rejected',
    respondedAt: new Date().toISOString(),
  });

  if (action) {
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
};

const cancelFriendRequest = async (userId, requestId) => {
  const reqSnap = await db.collection('friendRequests').doc(requestId).get();
  if (!reqSnap.exists) throw Object.assign(new Error('Request not found'), { status: 404 });
  const d = reqSnap.data();
  if (d.fromUserId !== userId) throw Object.assign(new Error('Not your request'), { status: 403 });
  if (d.status !== 'pending') throw Object.assign(new Error('Request already processed'), { status: 409 });
  await db.collection('friendRequests').doc(requestId).delete();
};

const getSentFriendRequests = async (userId) => {
  const snap = await db.collection('friendRequests')
    .where('fromUserId', '==', userId)
    .where('status', '==', 'pending')
    .get();
  return snap.docs.map((doc) => ({ requestId: doc.id, toUserId: doc.data().toUserId }));
};

const removeFriend = async (userId, friendId) => {
  const [userSnap, friendSnap] = await Promise.all([
    db.collection('users').doc(userId).get(),
    db.collection('users').doc(friendId).get(),
  ]);

  const userFriends = userSnap.data().friends || [];
  if (!userFriends.includes(friendId))
    throw Object.assign(new Error('This user is not your friend'), { status: 404 });

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
};

module.exports = { getFriends, getFriendRequests, getSentFriendRequests, cancelFriendRequest, sendFriendRequest, respondToRequest, removeFriend };
