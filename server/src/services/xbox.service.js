const axios = require('axios');
const BASE    = 'https://xbl.io/api/v2';
const headers = () => ({ 'X-Authorization': process.env.XBL_API_KEY, Accept: 'application/json' });

const resolveXuid = async (input) => {
  if (/^\d+$/.test(input)) return input;

  const fromUrl = input.match(/user\/([^/?]+)/i);
  const gamertag = fromUrl ? fromUrl[1] : input;

  console.log('[Xbox] Gamertag a resolver:', gamertag);
  console.log('[Xbox] API Key presente:', !!process.env.XBL_API_KEY);

  try {
    const res = await axios.get(`${BASE}/profile/gamertag/${encodeURIComponent(gamertag)}`, { headers: headers() });
    console.log('[Xbox] Response status:', res.status);
    console.log('[Xbox] Response data:', JSON.stringify(res.data));
  } catch (err) {
    console.error('[Xbox] Status:', err.response?.status);
    console.error('[Xbox] Error data:', JSON.stringify(err.response?.data));
    throw err;
  }
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
