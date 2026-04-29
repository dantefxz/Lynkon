const { db } = require('../config/firebase');
const { serializeBasicProfile } = require('../dtos/friend.dto');

const getProfile = async (uid) => {
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? snap.data() : null;
};

const getFriends = async (userId) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });

  const friendIds = snap.data().friends || [];
  const profiles  = await Promise.all(friendIds.map(getProfile));
  return profiles.filter(Boolean).map(serializeBasicProfile);
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

module.exports = { getFriends, getFriendRequests, sendFriendRequest, respondToRequest, removeFriend };
