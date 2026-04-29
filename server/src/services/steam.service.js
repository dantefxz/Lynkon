const axios = require('axios');
const BASE    = 'https://api.steampowered.com';
const DEV_KEY = () => process.env.STEAM_API_KEY;

const resolveSteamId = async (input) => {
  if (/^\d{17}$/.test(input)) return input;
  const res = await axios.get(`${BASE}/ISteamUser/ResolveVanityURL/v1/`, {
    params: { key: DEV_KEY(), vanityurl: input },
  });
  const { success, steamid } = res.data.response;
  if (success !== 1) throw Object.assign(new Error('Steam vanity URL not found'), { status: 404 });
  return steamid;
};

const getStats = async (steamId) => {
  const resolvedId = await resolveSteamId(steamId);
  const [gamesRes, summaryRes] = await Promise.all([
    axios.get(`${BASE}/IPlayerService/GetOwnedGames/v1/`, {
      params: { key: DEV_KEY(), steamid: resolvedId, include_appinfo: true, include_played_free_games: true },
    }),
    axios.get(`${BASE}/ISteamUser/GetPlayerSummaries/v2/`, {
      params: { key: DEV_KEY(), steamids: resolvedId },
    }),
  ]);
  const games        = gamesRes.data.response.games || [];
  const player       = summaryRes.data.response.players?.[0] || {};
  const totalMinutes = games.reduce((s, g) => s + (g.playtime_forever || 0), 0);
  return {
    platform:    'steam',
    steamId:     resolvedId,
    displayName: player.personaname,
    totalGames:  games.length,
    totalHours:  Math.round(totalMinutes / 60),
    profileUrl:  player.profileurl,
    avatar:      player.avatarmedium,
  };
};

const getGames = async (steamId) => {
  const resolvedId = await resolveSteamId(steamId);
  const res = await axios.get(`${BASE}/IPlayerService/GetOwnedGames/v1/`, {
    params: { key: DEV_KEY(), steamid: resolvedId, include_appinfo: true, include_played_free_games: true },
  });
  return (res.data.response.games || []).map((g) => ({
    gameId:        String(g.appid),
    name:          g.name,
    playtimeHours: Math.round((g.playtime_forever || 0) / 60),
    iconUrl: g.img_icon_url
      ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
      : null,
    platform: 'steam',
  }));
};

const getAchievements = async (steamId) => {
  const resolvedId = await resolveSteamId(steamId);
  const gamesRes = await axios.get(`${BASE}/IPlayerService/GetOwnedGames/v1/`, {
    params: { key: DEV_KEY(), steamid: resolvedId, include_appinfo: true },
  });
  const games = (gamesRes.data.response.games || []).sort((a, b) => b.playtime_forever - a.playtime_forever);
  if (!games.length) return [];
  const top    = games[0];
  const achRes = await axios.get(`${BASE}/ISteamUserStats/GetPlayerAchievements/v1/`, {
    params: { key: DEV_KEY(), steamid: resolvedId, appid: top.appid, l: 'english' },
  });
  const all      = achRes.data.playerstats?.achievements || [];
  const unlocked = all.filter((a) => a.achieved === 1);
  return {
    gameId:               String(top.appid),
    gameName:             top.name,
    totalAchievements:    all.length,
    unlockedAchievements: unlocked.length,
    achievements: unlocked.slice(0, 20).map((a) => ({
      apiname:     a.apiname,
      name:        a.name,
      description: a.description,
      unlockedAt:  a.unlocktime,
    })),
  };
};

module.exports = { getStats, getGames, getAchievements };