/**
 * Xbox Service via xbl.io
 * Dev key del servidor : process.env.XBL_API_KEY  (global, en .env — gratis en xbl.io/console)
 * Credencial del usuario: xuid  (guardado en Firestore, provisto por el usuario al vincular)
 *
 * Obtener el xuid: el cliente puede resolverlo via GET https://xbl.io/api/v2/friends/search?gt={gamertag}
 */
const axios = require('axios');

const BASE    = 'https://xbl.io/api/v2';
const headers = () => ({ 'X-Authorization': process.env.XBL_API_KEY, Accept: 'application/json' });

/** @param {string} xuid - de Firestore */
const getStats = async (xuid) => {
  const res     = await axios.get(`${BASE}/account/${xuid}`, { headers: headers() });
  const profile = res.data.profileUsers?.[0];
  const get     = (id) => profile?.settings?.find((s) => s.id === id)?.value;

  return {
    platform:    'xbox',
    xuid,
    gamertag:    get('Gamertag'),
    gamerscore:  get('Gamerscore'),
    accountTier: get('AccountTier'),
  };
};

/** @param {string} xuid - de Firestore */
const getGames = async (xuid) => {
  const res = await axios.get(`${BASE}/achievements/player/${xuid}`, { headers: headers() });
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

/** @param {string} xuid - de Firestore */
const getAchievements = async (xuid) => {
  const res = await axios.get(`${BASE}/achievements/player/${xuid}`, { headers: headers() });
  return (res.data.titles || []).slice(0, 10).map((t) => ({
    gameId:               String(t.titleId),
    gameName:             t.name,
    achievementsUnlocked: t.achievement?.currentAchievements,
    achievementsTotal:    t.achievement?.totalAchievements,
    gamerscore:           t.achievement?.currentGamerscore,
  }));
};

module.exports = { getStats, getGames, getAchievements };
