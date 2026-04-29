const axios = require('axios');
const BASE    = 'https://xbl.io/api/v2';
const headers = () => ({ 'X-Authorization': process.env.XBL_API_KEY, Accept: 'application/json' });

const resolveXuid = async (input) => {
  // Si ya es numérico, lo usamos directo
  if (/^\d+$/.test(input)) return input;

  // Si es gamertag, lo resolvemos
  const res = await axios.get(`${BASE}/friends/search?gt=${encodeURIComponent(input)}`, { headers: headers() });
  const profile = res.data.profileUsers?.[0];
  if (!profile) throw Object.assign(new Error('Xbox gamertag not found'), { status: 404 });
  return profile.id;
};

const getStats = async (xuid) => {
  const resolvedId = await resolveXuid(xuid);
  const res     = await axios.get(`${BASE}/account/${resolvedId}`, { headers: headers() });
  const profile = res.data.profileUsers?.[0];
  const get     = (id) => profile?.settings?.find((s) => s.id === id)?.value;
  return {
    platform:    'xbox',
    xuid:        resolvedId,
    gamertag:    get('Gamertag'),
    gamerscore:  get('Gamerscore'),
    accountTier: get('AccountTier'),
  };
};

const getGames = async (xuid) => {
  const resolvedId = await resolveXuid(xuid);
  const res = await axios.get(`${BASE}/achievements/player/${resolvedId}`, { headers: headers() });
  return (res.data.titles || []).map((t) => ({
    gameId:               String(t.titleId),
    name:                 t.name,
    platform:             'xbox',
    achievementsUnlocked: t.achievement?.currentAchievements,
    achievementsTotal:    t.achievement?.totalAchievements,
    gamerscore:           t.achievement?.currentGamerscore,
    lastPlayed:           t.titleHistory?.lastTimePlayed,
  }));
};

const getAchievements = async (xuid) => {
  const resolvedId = await resolveXuid(xuid);
  const res = await axios.get(`${BASE}/achievements/player/${resolvedId}`, { headers: headers() });
  return (res.data.titles || []).slice(0, 10).map((t) => ({
    gameId:               String(t.titleId),
    gameName:             t.name,
    achievementsUnlocked: t.achievement?.currentAchievements,
    achievementsTotal:    t.achievement?.totalAchievements,
    gamerscore:           t.achievement?.currentGamerscore,
  }));
};

module.exports = { getStats, getGames, getAchievements, resolveXuid };