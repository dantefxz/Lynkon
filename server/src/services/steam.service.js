const axios = require('axios');
const BASE    = 'https://api.steampowered.com';
const DEV_KEY = () => process.env.STEAM_API_KEY;

const resolveId = async (input) => {
  if (/^\d{17}$/.test(input)) return input;
  const res = await axios.get(`${BASE}/ISteamUser/ResolveVanityURL/v1/`, {
    params: { key: DEV_KEY(), vanityurl: input },
  });
  const { success, steamid } = res.data.response;
  if (success !== 1) throw Object.assign(new Error('Steam vanity URL not found'), { status: 404 });
  return steamid;
};

const getStats = async (steamId) => {
  const resolvedId = await resolveId(steamId);
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
  const resolvedId = await resolveId(steamId);
  const res = await axios.get(`${BASE}/IPlayerService/GetOwnedGames/v1/`, {
    params: { key: DEV_KEY(), steamid: resolvedId, include_appinfo: true, include_played_free_games: true },
  });
  return (res.data.response.games || []).map((g) => ({
    gameId:        String(g.appid),
    name:          g.name,
    playtimeHours: Math.round((g.playtime_forever || 0) / 60),
    cover:  `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
    platform: 'steam',
  }));
};

const getGameAchievements = async (steamId, appid) => {
  const resolvedId = await resolveId(steamId);
  try {
    const [playerRes, schemaRes] = await Promise.all([
      axios.get(`${BASE}/ISteamUserStats/GetPlayerAchievements/v1/`, {
        params: { key: DEV_KEY(), steamid: resolvedId, appid, l: 'spanish' },
      }),
      axios.get(`${BASE}/ISteamUserStats/GetSchemaForGame/v2/`, {
        params: { key: DEV_KEY(), appid, l: 'spanish' },
      }),
    ]);
    const playerAchs = playerRes.data.playerstats?.achievements || [];
    const schemaAchs = schemaRes.data.game?.availableGameStats?.achievements || [];
    const schemaMap  = Object.fromEntries(schemaAchs.map((a) => [a.name, a]));
    return playerAchs.map((a) => ({
      apiname:     a.apiname,
      name:        schemaMap[a.apiname]?.displayName || a.apiname,
      description: schemaMap[a.apiname]?.description || '',
      unlocked:    a.achieved === 1,
      unlockedAt:  a.achieved ? a.unlocktime : null,
      icon:        schemaMap[a.apiname]?.icon
        ? (schemaMap[a.apiname].icon.startsWith('http')
            ? schemaMap[a.apiname].icon
            : `https://steamcommunity.akamaihd.net/steamcommunity/public/images/apps/${appid}/${schemaMap[a.apiname].icon}.jpg`)
        : null,
      iconLocked: schemaMap[a.apiname]?.icongray
        ? (schemaMap[a.apiname].icongray.startsWith('http')
            ? schemaMap[a.apiname].icongray
            : `https://steamcommunity.akamaihd.net/steamcommunity/public/images/apps/${appid}/${schemaMap[a.apiname].icongray}.jpg`)
        : null,
    }));
  } catch {
    return [];
  }
};

const getAchievements = async (steamId) => {
  const resolvedId = await resolveId(steamId);
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

module.exports = { getStats, getGames, getAchievements, getGameAchievements, resolveId };