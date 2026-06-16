const {
  parseUpdateProfileDTO,
  parseUpdateSettingsDTO,
} = require('../dtos/user.dto');
const userService  = require('../services/user.service');
const axios        = require('axios');
const { db }       = require('../config/firebase');
const steamService = require('../services/steam.service');
const psnService   = require('../services/psn.service');
const xboxService  = require('../services/xbox.service');
const SERVICE_MAP  = { steam: steamService, psn: psnService, xbox: xboxService };

const getMyProfile = async (req, res, next) => {
  try {
    const profile = await userService.getMyProfile(req.user.uid);
    return res.status(200).json({ profile });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.params.id, req.user.uid);
    return res.status(200).json({ profile });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const createProfile = async (req, res, next) => {
  try {
    const { data, errors } = parseUpdateProfileDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const profile = await userService.createProfile(req.params.id, data);
    return res.status(201).json({ message: 'Profile created', profile });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { data, errors } = parseUpdateProfileDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const updated = await userService.updateProfile(req.params.id, data);
    return res.status(200).json({ message: 'Profile updated', updated });
  } catch (err) { next(err); }
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await userService.getSettings(req.params.id);
    return res.status(200).json({ settings });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const createSettings = async (req, res, next) => {
  try {
    const { data, errors } = parseUpdateSettingsDTO({
      notifications: req.body.notifications ?? true,
      privacy:       req.body.privacy       ?? 'public',
    });
    if (errors.length) return res.status(400).json({ errors });

    const settings = await userService.createSettings(req.params.id, data);
    return res.status(201).json({ message: 'Settings created', settings });
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    const { data, errors } = parseUpdateSettingsDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const updated = await userService.updateSettings(req.params.id, data);
    return res.status(200).json({ message: 'Settings updated', updated });
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });

    const snap = await db.collection('users').doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });
    const { email } = snap.data();

    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
    try {
      await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        { email, password, returnSecureToken: false },
      );
    } catch (err) {
      const code = err.response?.data?.error?.message || '';
      if (['INVALID_PASSWORD', 'EMAIL_NOT_FOUND', 'INVALID_LOGIN_CREDENTIALS', 'USER_DISABLED'].includes(code))
        return res.status(401).json({ error: 'Incorrect password' });
      throw err;
    }

    await userService.deleteUser(req.params.id);
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) { next(err); }
};

const searchUsers = async (req, res, next) => {
  try {
    const users = await userService.searchUsers(req.query.q);
    return res.status(200).json({ users });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const recommendations = await userService.getRecommendations(req.params.id);
    return res.status(200).json({ recommendations });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};


// ─── Helper: horas en vivo desde Steam ───────────────────────────────────────

const withLiveHours = async (userId, games) => {
  try {
    const snap = await db.collection('users').doc(userId).get();
    const linked = (snap.data()?.platforms || []).find((p) => p.platform === 'steam');
    if (!linked) return games;

    const freshGames = await steamService.getGames(linked.platformUserId);
    const freshMap = Object.fromEntries(freshGames.map((g) => [g.gameId, g.playtimeHours]));

    const merged = games.map((g) =>
      g.platform === 'steam' && freshMap[g.gameId] !== undefined
        ? { ...g, playtimeHours: freshMap[g.gameId] }
        : g,
    );

    // Persiste en background para que la próxima carga sea consistente
    const data = snap.data();
    const updateHours = (list) =>
      (list || []).map((g) =>
        g.platform === 'steam' && freshMap[g.gameId] !== undefined
          ? { ...g, playtimeHours: freshMap[g.gameId] }
          : g,
      );
    db.collection('users').doc(userId).update({
      favoriteGames: updateHours(data.favoriteGames),
      profileGames:  updateHours(data.profileGames),
    }).catch(() => {});

    return merged;
  } catch {
    return games;
  }
};

// ─── Favoritos ────────────────────────────────────────────────────────────────

const getFavorites = async (req, res, next) => {
  try {
    let games = await userService.getFavoriteGames(req.params.id);
    if (req.user.uid === req.params.id) games = await withLiveHours(req.params.id, games);
    return res.status(200).json({ favoriteGames: games });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const { gameId, name, platform, cover, playtimeHours } = req.body;
    const errors = [];
    if (!gameId)   errors.push('gameId is required');
    if (!name)     errors.push('name is required');
    if (!platform) errors.push('platform is required');
    if (!['steam', 'psn', 'xbox'].includes(platform))
      errors.push("platform must be 'steam', 'psn' or 'xbox'");
    if (errors.length) return res.status(400).json({ errors });

    const entry = await userService.addFavoriteGame(req.params.id, { gameId, name, platform, cover: cover || null, playtimeHours: playtimeHours || 0 });
    return res.status(201).json({ message: 'Game added to favorites', game: entry });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const getUserGameAchievements = async (req, res, next) => {
  try {
    const { id, platform, gameId } = req.params;
    if (!SERVICE_MAP[platform]) return res.status(400).json({ error: `Unsupported platform: ${platform}` });

    const snap = await db.collection('users').doc(id).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });

    const linked = (snap.data().platforms || []).find((p) => p.platform === platform);
    if (!linked) return res.status(404).json({ error: `User has no linked ${platform} account` });

    const achievements = await SERVICE_MAP[platform].getGameAchievements(linked.platformUserId, gameId);
    return res.status(200).json({ platform, gameId, achievements });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { platform } = req.query; // optional: narrows match when same gameId exists across platforms
    const result = await userService.removeFavoriteGame(req.params.id, gameId, platform);
    return res.status(200).json({ message: 'Game removed from favorites', ...result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

// ─── Profile Games ────────────────────────────────────────────────────────────

const getProfileGames = async (req, res, next) => {
  try {
    let games = await userService.getProfileGames(req.params.id);
    if (req.user.uid === req.params.id) games = await withLiveHours(req.params.id, games);
    return res.status(200).json({ profileGames: games });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const addProfileGame = async (req, res, next) => {
  try {
    const { gameId, name, platform, cover, playtimeHours } = req.body;
    const errors = [];
    if (!gameId)   errors.push('gameId is required');
    if (!name)     errors.push('name is required');
    if (!platform) errors.push('platform is required');
    if (!['steam', 'psn', 'xbox'].includes(platform))
      errors.push("platform must be 'steam', 'psn' or 'xbox'");
    if (errors.length) return res.status(400).json({ errors });

    const entry = await userService.addProfileGame(req.params.id, { gameId, name, platform, cover, playtimeHours });
    return res.status(201).json({ message: 'Game added to profile', game: entry });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const removeProfileGame = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { platform } = req.query;
    const result = await userService.removeProfileGame(req.params.id, gameId, platform);
    return res.status(200).json({ message: 'Game removed from profile', ...result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const setStatus = async (req, res, next) => {
  try {
    const { isOnline } = req.body;
    if (typeof isOnline !== 'boolean') return res.status(400).json({ error: 'isOnline must be boolean' });
    await userService.setOnlineStatus(req.user.uid, isOnline);
    return res.status(200).json({ message: 'Status updated' });
  } catch (err) { next(err); }
};

const VALID_SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

const setSkillTag = async (req, res, next) => {
  try {
    const { level } = req.body;
    if (level !== null && level !== undefined && !VALID_SKILL_LEVELS.includes(level))
      return res.status(400).json({ error: 'Invalid skill level' });
    await userService.setSkillTag(req.params.id, req.params.gameId, level ?? null);
    return res.status(200).json({ message: 'Skill tag updated' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const getUserAchievements = async (req, res, next) => {
  try {
    const result = await userService.getUserGameAchievements(req.params.id, req.params.platform, req.params.gameId);
    return res.status(200).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

module.exports = {
  getMyProfile, getProfile, createProfile, updateProfile,
  getSettings, createSettings, updateSettings,
  deleteUser, searchUsers, getRecommendations,
  getFavorites, addFavorite, removeFavorite,
  getProfileGames, addProfileGame, removeProfileGame,
  setSkillTag, setStatus,
  getUserGameAchievements,
};
