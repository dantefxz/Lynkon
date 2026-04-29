const {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getUserTitles,
  getUserTrophySummary,
  getTitleTrophies,
  getUserTrophiesEarnedForTitle,
} = require('psn-api');

const getAccessToken = async (npssoToken) => {
  const code = await exchangeNpssoForCode(npssoToken);
  const { accessToken } = await exchangeCodeForAccessToken(code);
  return accessToken;
};

const getStats = async (npssoToken) => {
  throw Object.assign(new Error('PSN: integración en desarrollo, próximamente disponible'), { status: 501 });
  const accessToken = await getAccessToken(npssoToken);
  const { trophySummary } = await getUserTrophySummary({ accessToken }, 'me');
  return {
    platform:      'psn',
    accountId:     trophySummary.accountId,
    trophyLevel:   trophySummary.trophyLevel,
    progress:      trophySummary.progress,
    bronzeCount:   trophySummary.earnedTrophies.bronze,
    silverCount:   trophySummary.earnedTrophies.silver,
    goldCount:     trophySummary.earnedTrophies.gold,
    platinumCount: trophySummary.earnedTrophies.platinum,
  };
};

const getGames = async (npssoToken) => {
  throw Object.assign(new Error('PSN: integración en desarrollo, próximamente disponible'), { status: 501 });
  const accessToken = await getAccessToken(npssoToken);
  const { trophyTitles } = await getUserTitles({ accessToken }, 'me');
  return (trophyTitles || []).map((t) => ({
    gameId:        t.npCommunicationId,
    name:          t.trophyTitleName,
    platform:      t.trophyTitlePlatform,
    bronzeCount:   t.earnedTrophies.bronze,
    silverCount:   t.earnedTrophies.silver,
    goldCount:     t.earnedTrophies.gold,
    platinumCount: t.earnedTrophies.platinum,
    lastPlayed:    t.lastUpdatedDateTime,
  }));
};

const getAchievements = async (npssoToken) => {
  throw Object.assign(new Error('PSN: integración en desarrollo, próximamente disponible'), { status: 501 });
  const accessToken = await getAccessToken(npssoToken);
  const { trophyTitles } = await getUserTitles({ accessToken }, 'me');
  if (!trophyTitles?.length) return [];
  const top = trophyTitles[0];
  const [allTrophies, earnedTrophies] = await Promise.all([
    getTitleTrophies({ accessToken }, top.npCommunicationId, 'all'),
    getUserTrophiesEarnedForTitle({ accessToken }, 'me', top.npCommunicationId, 'all'),
  ]);
  const earnedMap = new Map(
    (earnedTrophies.trophies || []).map((t) => [t.trophyId, t])
  );
  return {
    gameId:   top.npCommunicationId,
    gameName: top.trophyTitleName,
    trophies: (allTrophies.trophies || [])
      .filter((t) => earnedMap.get(t.trophyId)?.earned)
      .slice(0, 20)
      .map((t) => ({
        trophyId: t.trophyId,
        name:     t.trophyName,
        detail:   t.trophyDetail,
        type:     t.trophyType,
        earnedAt: earnedMap.get(t.trophyId)?.earnedDateTime,
      })),
  };
};

module.exports = { getStats, getGames, getAchievements };