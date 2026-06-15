const { db, auth, admin } = require('../config/firebase');
const { serializeProfile } = require('../dtos/user.dto');
const { normalizeAvatarId } = require('../utils/avatar.utils');

const ensureAvatarIdPersisted = async (userId, userData) => {
  const avatarId = normalizeAvatarId(userData.avatarId || userData.avatar, userId);
  if (userData.avatarId !== avatarId) {
    await db.collection('users').doc(userId).update({ avatarId, updatedAt: new Date().toISOString() });
    return { ...userData, avatarId };
  }
  return userData;
};

const getMyProfile = async (userId) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User profile not found'), { status: 404 });
  const userData = await ensureAvatarIdPersisted(userId, snap.data());
  return serializeProfile(userData, true);
};

const getProfile = async (userId, requesterId) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });
  const userData = await ensureAvatarIdPersisted(userId, snap.data());
  return serializeProfile(userData, requesterId === userId);
};

const createProfile = async (userId, data) => {
  data.avatarId = normalizeAvatarId(data.avatarId || data.avatar, userId);
  delete data.avatar;
  data.updatedAt = new Date().toISOString();
  await db.collection('users').doc(userId).update(data);
  return data;
};

const updateProfile = async (userId, data) => {
  if (data.avatarId || data.avatar) {
    data.avatarId = normalizeAvatarId(data.avatarId || data.avatar, userId);
  }
  delete data.avatar;
  data.updatedAt = new Date().toISOString();
  await db.collection('users').doc(userId).update(data);
  return data;
};

const getSettings = async (userId) => {
  const snap = await db.collection('users').doc(userId)
    .collection('settings').doc('preferences').get();
  if (!snap.exists) throw Object.assign(new Error('Settings not found'), { status: 404 });
  return snap.data();
};

const createSettings = async (userId, data) => {
  data.createdAt = new Date().toISOString();
  await db.collection('users').doc(userId)
    .collection('settings').doc('preferences').set(data);
  return data;
};

const updateSettings = async (userId, data) => {
  data.updatedAt = new Date().toISOString();
  await db.collection('users').doc(userId)
    .collection('settings').doc('preferences').update(data);
  return data;
};

const deleteUser = async (userId) => {
  const batch = db.batch();
  batch.delete(db.collection('users').doc(userId).collection('settings').doc('preferences'));
  batch.delete(db.collection('users').doc(userId));
  await batch.commit();
  await auth.deleteUser(userId);
};

const searchUsers = async (q) => {
  if (!q || q.trim().length < 2)
    throw Object.assign(new Error('Query must be at least 2 characters'), { status: 400 });

  const snap = await db.collection('users')
    .where('username', '>=', q)
    .where('username', '<=', q + '\uf8ff')
    .limit(20).get();

  return snap.docs.map((d) => {
    const u = d.data();
    return { uid: u.uid, username: u.username, avatarId: normalizeAvatarId(u.avatarId || u.avatar, u.uid) };
  });
};

const getRecommendations = async (userId) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });

  const userData = snap.data();
  if (userData.isUnder16)
    throw Object.assign(new Error('Recommendations available for users 16+ only'), { status: 403 });

  const friendIds = new Set(userData.friends || []);
  const myGameIds = (userData.favoriteGames || []).map((g) => g.gameId);

  let results = [];

  if (myGameIds.length) {
    // Sync favoriteGameIds flat array (needed for array-contains-any Firestore query)
    const stored = userData.favoriteGameIds || [];
    const needsSync = stored.length !== myGameIds.length || myGameIds.some((id) => !stored.includes(id));
    if (needsSync) {
      await db.collection('users').doc(userId).update({ favoriteGameIds: myGameIds });
    }

    const recSnap = await db.collection('users')
      .where('favoriteGameIds', 'array-contains-any', myGameIds.slice(0, 10))
      .limit(30).get();

    results = recSnap.docs
      .filter((d) => d.id !== userId && !friendIds.has(d.id))
      .map((d) => {
        const u = d.data();
        const userGameIds = u.favoriteGameIds || (u.favoriteGames || []).map((g) => g.gameId);
        const common = userGameIds.filter((gid) => myGameIds.includes(gid));
        return { uid: u.uid, username: u.username, avatarId: normalizeAvatarId(u.avatarId || u.avatar, u.uid), commonGamesCount: common.length };
      })
      .sort((a, b) => b.commonGamesCount - a.commonGamesCount);
  }

  // Fallback: if no game-based results, return recent users excluding friends
  if (!results.length) {
    const fallbackSnap = await db.collection('users')
      .orderBy('updatedAt', 'desc')
      .limit(20).get();

    results = fallbackSnap.docs
      .filter((d) => d.id !== userId && !friendIds.has(d.id))
      .slice(0, 10)
      .map((d) => {
        const u = d.data();
        return { uid: u.uid, username: u.username, avatarId: normalizeAvatarId(u.avatarId || u.avatar, u.uid), commonGamesCount: 0 };
      });
  }

  return results;
};


// ─── Favoritos ────────────────────────────────────────────────────────────────
// stored at users/{uid}.favoriteGames — capped at 20 per user

const addFavoriteGame = async (userId, game) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });

  const favorites = snap.data().favoriteGames || [];

  if (favorites.find((g) => g.gameId === game.gameId && g.platform === game.platform))
    throw Object.assign(new Error('Game is already in favorites'), { status: 409 });

  if (favorites.length >= 20)
    throw Object.assign(new Error('Favorites limit reached (max 20 games)'), { status: 422 });

  const newEntry = {
    gameId:        game.gameId,
    name:          game.name,
    platform:      game.platform,
    cover:         game.cover || null,
    playtimeHours: game.playtimeHours || 0,
    addedAt:       new Date().toISOString(),
  };

  await db.collection('users').doc(userId).update({
    favoriteGames: [...favorites, newEntry],
    favoriteGameIds: admin.firestore.FieldValue.arrayUnion(game.gameId),
  });

  return newEntry;
};

const removeFavoriteGame = async (userId, gameId, platform) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });

  const favorites = snap.data().favoriteGames || [];
  const updated   = favorites.filter(
    (g) => !(g.gameId === gameId && (platform ? g.platform === platform : true))
  );

  if (updated.length === favorites.length)
    throw Object.assign(new Error('Game not found in favorites'), { status: 404 });

  await db.collection('users').doc(userId).update({
    favoriteGames: updated,
    favoriteGameIds: admin.firestore.FieldValue.arrayRemove(gameId),
  });
  return { removed: favorites.length - updated.length };
};

const getFavoriteGames = async (userId) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });
  return snap.data().favoriteGames || [];
};

// ─── Profile Games ────────────────────────────────────────────────────────────
// games the user manually picks to show on their public profile

const addProfileGame = async (userId, game) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });

  const profileGames = snap.data().profileGames || [];

  if (profileGames.find((g) => g.gameId === game.gameId && g.platform === game.platform))
    throw Object.assign(new Error('Game is already in profile'), { status: 409 });

  const newEntry = {
    gameId:        game.gameId,
    name:          game.name,
    platform:      game.platform,
    cover:         game.cover || null,
    playtimeHours: game.playtimeHours || 0,
    addedAt:       new Date().toISOString(),
  };

  await db.collection('users').doc(userId).update({
    profileGames: [...profileGames, newEntry],
  });

  return newEntry;
};

const removeProfileGame = async (userId, gameId, platform) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });

  const profileGames = snap.data().profileGames || [];
  const updated      = profileGames.filter(
    (g) => !(g.gameId === gameId && (platform ? g.platform === platform : true))
  );

  if (updated.length === profileGames.length)
    throw Object.assign(new Error('Game not found in profile'), { status: 404 });

  await db.collection('users').doc(userId).update({ profileGames: updated });
  return { removed: profileGames.length - updated.length };
};

const getProfileGames = async (userId) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });
  return snap.data().profileGames || [];
};

module.exports = {
  getMyProfile, getProfile, createProfile, updateProfile,
  getSettings, createSettings, updateSettings,
  deleteUser, searchUsers, getRecommendations,
  addFavoriteGame, removeFavoriteGame, getFavoriteGames,
  addProfileGame, removeProfileGame, getProfileGames,
};
