const { db, auth } = require('../config/firebase');
const { serializeProfile } = require('../dtos/user.dto');

const getMyProfile = async (userId) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User profile not found'), { status: 404 });
  return serializeProfile(snap.data(), true);
};

const getProfile = async (userId, requesterId) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });
  return serializeProfile(snap.data(), requesterId === userId);
};

const createProfile = async (userId, data) => {
  data.updatedAt = new Date().toISOString();
  await db.collection('users').doc(userId).update(data);
  return data;
};

const updateProfile = async (userId, data) => {
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
    return { uid: u.uid, username: u.username, avatarId: u.avatarId };
  });
};

const getRecommendations = async (userId) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });

  const userData = snap.data();
  if (userData.isUnder16)
    throw Object.assign(new Error('Recommendations available for users 16+ only'), { status: 403 });

  const myGameIds = (userData.favoriteGames || []).map((g) => g.gameId);
  if (!myGameIds.length) return [];

  const recSnap = await db.collection('users')
    .where('favoriteGames', 'array-contains-any', myGameIds.slice(0, 10))
    .limit(20).get();

  return recSnap.docs
    .filter((d) => d.id !== userId)
    .map((d) => {
      const u = d.data();
      const common = (u.favoriteGames || []).filter((g) => myGameIds.includes(g.gameId));
      return { uid: u.uid, username: u.username, avatarId: u.avatarId, commonGamesCount: common.length };
    })
    .sort((a, b) => b.commonGamesCount - a.commonGamesCount);
};


// ─── Favoritos ────────────────────────────────────────────────────────────────
// Se persiste en: users/{uid}.favoriteGames = [{ gameId, name, platform, addedAt }]
// Límite: 20 juegos favoritos por usuario.

const addFavoriteGame = async (userId, game) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });

  const favorites = snap.data().favoriteGames || [];

  if (favorites.find((g) => g.gameId === game.gameId && g.platform === game.platform))
    throw Object.assign(new Error('Game is already in favorites'), { status: 409 });

  if (favorites.length >= 20)
    throw Object.assign(new Error('Favorites limit reached (max 20 games)'), { status: 422 });

  const newEntry = {
    gameId:   game.gameId,
    name:     game.name,
    platform: game.platform,
    addedAt:  new Date().toISOString(),
  };

  await db.collection('users').doc(userId).update({
    favoriteGames: [...favorites, newEntry],
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

  await db.collection('users').doc(userId).update({ favoriteGames: updated });
  return { removed: favorites.length - updated.length };
};

const getFavoriteGames = async (userId) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });
  return snap.data().favoriteGames || [];
};

module.exports = {
  getMyProfile, getProfile, createProfile, updateProfile,
  getSettings, createSettings, updateSettings,
  deleteUser, searchUsers, getRecommendations,
  addFavoriteGame, removeFavoriteGame, getFavoriteGames,
};
