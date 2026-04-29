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

// ─── Helper: lee la credencial del usuario desde Firestore ───────────────────
//
// Cada usuario guarda su propia credencial por plataforma:
//   Steam → steamId   (el server usa STEAM_API_KEY global para consultar)
//   Xbox  → xuid      (el server usa XBL_API_KEY   global para consultar)
//   PSN   → npssoToken (el server no tiene key propia; usa el token del usuario)
//
const getUserPlatformCredential = async (userId, platform) => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });

  const linked = (snap.data().platforms || []).find((p) => p.platform === platform);
  if (!linked) throw Object.assign(new Error(`Platform ${platform} is not linked`), { status: 404 });

  // platformUserId contiene el steamId / puuid / xuid / npssoToken según la plataforma
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
    if (data.platform === 'xbox') {
      platformUserId = await xboxService.resolveXuid(data.platformUserId);
    }

    await db.collection('users').doc(userId).update({
      platforms: [
        ...platforms,
        {
          platform:       data.platform,
          platformUserId,
          linkedAt:       new Date().toISOString(),
        },
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

    const current = snap.data().platforms || [];
    const updated = current.filter((p) => p.platform !== platform);

    if (updated.length === current.length)
      return res.status(404).json({ error: `${platform} is not linked` });

    await db.collection('users').doc(userId).update({ platforms: updated });
    return res.status(200).json({ message: `${platform} unlinked successfully` });
  } catch (err) { next(err); }
};

// ─── Consultas a plataformas ─────────────────────────────────────────────────
// El controller lee la credencial del usuario desde Firestore y la pasa al service.
// El service combina esa credencial con la dev key del servidor (en .env) para llamar a la API.

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

module.exports = {
  getSupportedPlatforms, getLinkedPlatforms, linkPlatform, unlinkPlatform,
  getPlatformStats, getPlatformGames, getPlatformAchievements,
};
