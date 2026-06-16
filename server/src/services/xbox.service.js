const axios = require('axios');
const BASE    = 'https://api.xbl.io/v2';
const headers = () => ({ 'X-Authorization': process.env.XBL_API_KEY, Accept: 'application/json' });

const validateXuid = (input) => {
  if (/^\d+$/.test(input)) return input;
  throw Object.assign(
    new Error('Xbox requiere el XUID numérico. Obtené el tuyo en xuidgenerator.com'),
    { status: 400 }
  );
};

const getStats = async (xuid) => {
  const resolvedId = validateXuid(xuid);
  const res     = await axios.get(`${BASE}/account/${resolvedId}`, { headers: headers() });
  const profile = res.data.content?.profileUsers?.[0];
  const get     = (id) => profile?.settings?.find((s) => s.id === id)?.value;
  return {
    platform:    'xbox',
    xuid:        resolvedId,
    gamertag:    get('Gamertag'),
    gamerscore:  get('Gamerscore'),
    accountTier: get('AccountTier'),
    avatar:      get('GameDisplayPicRaw'),
  };
};

const getGames = async (xuid) => {
  const resolvedId = validateXuid(xuid);
  const res = await axios.get(`${BASE}/achievements/player/${resolvedId}`, { headers: headers() });
  return (res.data.content?.titles || []).map((t) => ({
    gameId:               String(t.titleId),
    name:                 t.name,
    platform:             'xbox',
    cover:                t.displayImage || null,
    totalAchievements:    t.achievement?.totalAchievements    || 0,
    completedAchievements:t.achievement?.currentAchievements  || 0,
    // Campos originales mantenidos por compatibilidad
    gamerscore:           t.achievement?.currentGamerscore,
    lastPlayed:           t.titleHistory?.lastTimePlayed,
  }));
};

const getAchievements = async (xuid) => {
  const resolvedId = validateXuid(xuid);
  const res = await axios.get(`${BASE}/achievements/player/${resolvedId}`, { headers: headers() });
  return (res.data.content?.titles || []).slice(0, 10).map((t) => ({
    gameId:               String(t.titleId),
    gameName:             t.name,
    totalAchievements:    t.achievement?.totalAchievements   || 0,
    completedAchievements:t.achievement?.currentAchievements || 0,
    gamerscore:           t.achievement?.currentGamerscore,
  }));
};

const validateTitleId = (input) => {
  if (/^\d+$/.test(input)) return input;
  throw Object.assign(new Error('Invalid titleId'), { status: 400 });
};

const getGameAchievements = async (xuid, titleId) => {
  try {
    const resolvedId       = validateXuid(xuid);
    const resolvedTitleId  = validateTitleId(titleId);
    const res = await axios.get(
      `${BASE}/achievements/player/${resolvedId}/title/${resolvedTitleId}`,
      { headers: headers() }
    );
    return (res.data.content?.achievements || []).map((a) => ({
      apiname:     String(a.id),
      name:        a.name || '',
      description: a.description || '',
      unlocked:    a.progressState === 'Achieved',
      unlockedAt:  a.progression?.timeUnlocked || null,
      icon:        a.mediaAssets?.find((m) => m.type === 'Icon')?.url || null,
    }));
  } catch {
    return [];
  }
};

module.exports = { getStats, getGames, getAchievements, getGameAchievements };