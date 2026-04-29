const { db, auth } = require('../config/firebase');
const {
  parseUpdateProfileDTO,
  parseUpdateSettingsDTO,
  serializeProfile,
} = require('../dtos/user.dto');

// ─── Profile ─────────────────────────────────────────────────────────────────

/**
 * Obtiene el perfil del usuario autenticado (sin pasar ID en URL)
 */
const getMyProfile = async (req, res, next) => {
  try {
    const snap = await db.collection('users').doc(req.user.uid).get();
    if (!snap.exists) return res.status(404).json({ error: 'User profile not found' });

    return res.status(200).json({
      profile: serializeProfile(snap.data(), true),
    });
  } catch (err) { next(err); }
};

const getProfile = async (req, res, next) => {
  try {
    const snap = await db.collection('users').doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json({
      profile: serializeProfile(snap.data(), req.user.uid === req.params.id),
    });
  } catch (err) { next(err); }
};

const createProfile = async (req, res, next) => {
  try {
    const { data, errors } = parseUpdateProfileDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    data.updatedAt = new Date().toISOString();
    await db.collection('users').doc(req.params.id).update(data);

    return res.status(201).json({ message: 'Profile created', profile: data });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { data, errors } = parseUpdateProfileDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    data.updatedAt = new Date().toISOString();
    await db.collection('users').doc(req.params.id).update(data);

    return res.status(200).json({ message: 'Profile updated', updated: data });
  } catch (err) { next(err); }
};

// ─── Settings ────────────────────────────────────────────────────────────────

const getSettings = async (req, res, next) => {
  try {
    const snap = await db
      .collection('users').doc(req.params.id)
      .collection('settings').doc('preferences').get();

    if (!snap.exists) return res.status(404).json({ error: 'Settings not found' });
    return res.status(200).json({ settings: snap.data() });
  } catch (err) { next(err); }
};

const createSettings = async (req, res, next) => {
  try {
    const { data, errors } = parseUpdateSettingsDTO({
      notifications: req.body.notifications ?? true,
      privacy:       req.body.privacy       ?? 'public',
    });
    if (errors.length) return res.status(400).json({ errors });

    data.createdAt = new Date().toISOString();
    await db.collection('users').doc(req.params.id)
      .collection('settings').doc('preferences').set(data);

    return res.status(201).json({ message: 'Settings created', settings: data });
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    const { data, errors } = parseUpdateSettingsDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    data.updatedAt = new Date().toISOString();
    await db.collection('users').doc(req.params.id)
      .collection('settings').doc('preferences').update(data);

    return res.status(200).json({ message: 'Settings updated', updated: data });
  } catch (err) { next(err); }
};

// ─── Delete ──────────────────────────────────────────────────────────────────

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const batch = db.batch();
    batch.delete(db.collection('users').doc(id).collection('settings').doc('preferences'));
    batch.delete(db.collection('users').doc(id));
    await batch.commit();
    await auth.deleteUser(id);

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) { next(err); }
};

// ─── Search ──────────────────────────────────────────────────────────────────

const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2)
      return res.status(400).json({ error: 'Query must be at least 2 characters' });

    const snap = await db.collection('users')
      .where('username', '>=', q)
      .where('username', '<=', q + '\uf8ff')
      .limit(20).get();

    const users = snap.docs.map((d) => {
      const u = d.data();
      return { uid: u.uid, username: u.username, avatarId: u.avatarId };
    });

    return res.status(200).json({ users });
  } catch (err) { next(err); }
};

// ─── Recommendations ─────────────────────────────────────────────────────────

const getRecommendations = async (req, res, next) => {
  try {
    const snap = await db.collection('users').doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });

    const userData = snap.data();
    if (userData.isUnder16) {
      return res.status(403).json({ error: 'Recommendations available for users 16+ only' });
    }

    const myGameIds = (userData.favoriteGames || []).map((g) => g.gameId);
    if (!myGameIds.length) return res.status(200).json({ recommendations: [] });

    const recSnap = await db.collection('users')
      .where('favoriteGames', 'array-contains-any', myGameIds.slice(0, 10))
      .limit(20).get();

    const recommendations = recSnap.docs
      .filter((d) => d.id !== req.params.id)
      .map((d) => {
        const u = d.data();
        const common = (u.favoriteGames || []).filter((g) => myGameIds.includes(g.gameId));
        return { uid: u.uid, username: u.username, avatarId: u.avatarId, commonGamesCount: common.length };
      })
      .sort((a, b) => b.commonGamesCount - a.commonGamesCount);

    return res.status(200).json({ recommendations });
  } catch (err) { next(err); }
};

module.exports = {
  getMyProfile, getProfile, createProfile, updateProfile,
  getSettings, createSettings, updateSettings,
  deleteUser, searchUsers, getRecommendations,
};
