const { db } = require('../config/firebase');
const {
  parseLinkPlatformDTO,
  serializeLinkedPlatform,
  SUPPORTED_PLATFORMS,
  PLATFORM_CREDENTIAL_FIELD,
} = require('../dtos/platform.dto');
const steamService = require('../services/steam.service');
const psnService   = require('../services/psn.service');
const xboxService  = require('../services/xbox.service');

const SERVICE_MAP = { steam: steamService, psn: psnService, xbox: xboxService };

const getUserPlatformCredential = async (userId, platform) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });

  const linked = (snap.data().platforms || []).find((p) => p.platform === platform);
  if (!linked) throw Object.assign(new Error(`Platform ${platform} is not linked`), { status: 404 });

  return linked.platformUserId;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

const getSupportedPlatforms = (_req, res) =>
  res.status(200).json({
    platforms: SUPPORTED_PLATFORMS.map((id) => ({
      id,
      name:            id.toUpperCase(),
      credentialField: PLATFORM_CREDENTIAL_FIELD[id],
    })),
  });

const getLinkedPlatforms = async (req, res, next) => {
  try {
    const snap = await db.collection('users').doc(req.user.uid).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });

    const platforms = (snap.data().platforms || []).map(serializeLinkedPlatform);
    return res.status(200).json({ platforms });
  } catch (err) { next(err); }
};

const linkPlatform = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { data, errors } = parseLinkPlatformDTO(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const snap = await db.collection('users').doc(userId).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });

    const platforms = snap.data().platforms || [];
    if (platforms.find((p) => p.platform === data.platform))
      return res.status(409).json({ error: `${data.platform} is already linked` });

    let platformUserId = data.platformUserId;
    if (data.platform === 'steam') {
      platformUserId = await steamService.resolveId(data.platformUserId);
    }

    await db.collection('users').doc(userId).update({
      platforms: [
        ...platforms,
        { platform: data.platform, platformUserId, linkedAt: new Date().toISOString() },
      ],
    });

    return res.status(201).json({ message: `${data.platform} linked successfully` });
  } catch (err) { next(err); }
};

const unlinkPlatform = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { platform } = req.params;
    const snap = await db.collection('users').doc(userId).get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });

    const data    = snap.data();
    const current = data.platforms || [];
    const updated = current.filter((p) => p.platform !== platform);

    if (updated.length === current.length)
      return res.status(404).json({ error: `${platform} is not linked` });

    const keepGame = (g) => g.platform !== platform;

    await db.collection('users').doc(userId).update({
      platforms:    updated,
      favoriteGames: (data.favoriteGames || []).filter(keepGame),
      profileGames:  (data.profileGames  || []).filter(keepGame),
    });
    return res.status(200).json({ message: `${platform} unlinked successfully` });
  } catch (err) { next(err); }
};

// ─── Plataformas ──────────────────────────────────────────────────────────────

const getPlatformStats = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { platform } = req.params;
    if (!SERVICE_MAP[platform]) return res.status(400).json({ error: `Unsupported platform: ${platform}` });

    const platformUserId = await getUserPlatformCredential(userId, platform);
    const stats = await SERVICE_MAP[platform].getStats(platformUserId);
    return res.status(200).json({ platform, stats });
  } catch (err) { next(err); }
};

const getPlatformGames = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { platform } = req.params;
    if (!SERVICE_MAP[platform]) return res.status(400).json({ error: `Unsupported platform: ${platform}` });

    const platformUserId = await getUserPlatformCredential(userId, platform);
    const games = await SERVICE_MAP[platform].getGames(platformUserId);
    return res.status(200).json({ platform, games });
  } catch (err) { next(err); }
};

const getPlatformAchievements = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { platform } = req.params;
    if (!SERVICE_MAP[platform]) return res.status(400).json({ error: `Unsupported platform: ${platform}` });

    const platformUserId = await getUserPlatformCredential(userId, platform);
    const achievements = await SERVICE_MAP[platform].getAchievements(platformUserId);
    return res.status(200).json({ platform, achievements });
  } catch (err) { next(err); }
};

const syncPlatform = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { platform } = req.params;
    if (!SERVICE_MAP[platform]) return res.status(400).json({ error: `Unsupported platform: ${platform}` });

    const platformUserId = await getUserPlatformCredential(userId, platform);

    const [, freshGames] = await Promise.all([
      SERVICE_MAP[platform].getStats(platformUserId),
      SERVICE_MAP[platform].getGames(platformUserId),
    ]);

    const ref = db.collection('users').doc(userId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'User not found' });

    const data    = snap.data();
    const updatedAt = new Date().toISOString();

    // gameId → playtimeHours fresco desde la plataforma
    const freshMap = Object.fromEntries(freshGames.map((g) => [g.gameId, g.playtimeHours]));

    const updateHours = (list) =>
      (list || []).map((g) =>
        g.platform === platform && freshMap[g.gameId] !== undefined
          ? { ...g, playtimeHours: freshMap[g.gameId] }
          : g,
      );

    await ref.update({
      platforms:     (data.platforms || []).map((p) => p.platform === platform ? { ...p, linkedAt: updatedAt } : p),
      favoriteGames: updateHours(data.favoriteGames),
      profileGames:  updateHours(data.profileGames),
    });

    return res.status(200).json({ message: `${platform} synchronized successfully`, platform, linkedAt: updatedAt });
  } catch (err) { next(err); }
};

// ─── Visibilidad ──────────────────────────────────────────────────────────────

const toggleGameVisibility = async (req, res, next) => {
  try {
    const userId   = req.user.uid;
    const { platform, gameId } = req.params;

    if (!SERVICE_MAP[platform])
      return res.status(400).json({ error: `Unsupported platform: ${platform}` });

    if (!gameId?.trim())
      return res.status(400).json({ error: 'gameId is required' });

    const visRef = db
      .collection('users').doc(userId)
      .collection('gameVisibility').doc(`${platform}_${gameId}`);

    const snap = await visRef.get();
    const currentlyHidden = snap.exists ? snap.data().hidden : false;
    const newHidden = !currentlyHidden;

    await visRef.set({
      platform,
      gameId,
      hidden:    newHidden,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ message: `Game visibility updated`, platform, gameId, hidden: newHidden });
  } catch (err) { next(err); }
};

const getGameVisibility = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const snap = await db
      .collection('users').doc(userId)
      .collection('gameVisibility').get();

    const visibility = {};
    snap.docs.forEach((d) => {
      const { platform, gameId, hidden } = d.data();
      visibility[`${platform}_${gameId}`] = { platform, gameId, hidden };
    });

    return res.status(200).json({ visibility });
  } catch (err) { next(err); }
};

const getGameAchievements = async (req, res, next) => {
  try {
    const { platform, gameId } = req.params;
    if (!SERVICE_MAP[platform]) return res.status(400).json({ error: `Unsupported platform: ${platform}` });
    const platformUserId = await getUserPlatformCredential(req.user.uid, platform);
    const achievements   = await SERVICE_MAP[platform].getGameAchievements(platformUserId, gameId);
    return res.status(200).json({ platform, gameId, achievements });
  } catch (err) { next(err); }
};

module.exports = {
  getSupportedPlatforms, getLinkedPlatforms, linkPlatform, unlinkPlatform,
  getPlatformStats, getPlatformGames, getPlatformAchievements, getGameAchievements,
  syncPlatform,
  toggleGameVisibility, getGameVisibility,
};
