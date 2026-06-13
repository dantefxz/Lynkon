const {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getUserTitles,
  getUserTrophyProfileSummary,
  getTitleTrophies,
  getUserTrophiesEarnedForTitle,
} = require('psn-api');

const getAccessToken = async (npssoToken) => {
  const code = await exchangeNpssoForCode(npssoToken);
  const { accessToken } = await exchangeCodeForAccessToken(code);
  return accessToken;
};

const getStats = async (npssoToken) => {
  const accessToken = await getAccessToken(npssoToken);
  const trophySummary = await getUserTrophyProfileSummary({ accessToken }, 'me');
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
  const accessToken = await getAccessToken(npssoToken);
  const { trophyTitles } = await getUserTitles({ accessToken }, 'me');
  return (trophyTitles || []).map((t) => {
    const earned  = t.earnedTrophies  || {};
    const defined = t.definedTrophies || {};

    const completedAchievements =
      (earned.bronze   || 0) +
      (earned.silver   || 0) +
      (earned.gold     || 0) +
      (earned.platinum || 0);

    const totalAchievements =
      (defined.bronze   || 0) +
      (defined.silver   || 0) +
      (defined.gold     || 0) +
      (defined.platinum || 0);

    return {
      gameId:               t.npCommunicationId,
      name:                 t.trophyTitleName,
      platform:             t.trophyTitlePlatform,
      cover:                t.trophyTitleIconUrl || null,
      // Campos que el cliente necesita para mostrar progreso
      totalAchievements,
      completedAchievements,
      // Campos originales mantenidos por compatibilidad
      bronzeCount:          earned.bronze   || 0,
      silverCount:          earned.silver   || 0,
      goldCount:            earned.gold     || 0,
      platinumCount:        earned.platinum || 0,
      lastPlayed:           t.lastUpdatedDateTime,
    };
  });
};

const getAchievements = async (npssoToken) => {
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

const getGameAchievements = async (npssoToken, npCommId) => {
  try {
    const accessToken = await getAccessToken(npssoToken);
    const [allTrophies, earnedTrophies] = await Promise.all([
      getTitleTrophies({ accessToken }, npCommId, 'all'),
      getUserTrophiesEarnedForTitle({ accessToken }, 'me', npCommId, 'all'),
    ]);
    const earnedMap = new Map(
      (earnedTrophies.trophies || []).map((t) => [t.trophyId, t])
    );
    return (allTrophies.trophies || []).map((t) => ({
      apiname:     String(t.trophyId),
      name:        t.trophyName || '',
      description: t.trophyDetail || '',
      unlocked:    !!earnedMap.get(t.trophyId)?.earned,
      unlockedAt:  earnedMap.get(t.trophyId)?.earnedDateTime || null,
      icon:        t.trophyIconUrl || null,
      type:        t.trophyType,
    }));
  } catch {
    return [];
  }
};

module.exports = { getStats, getGames, getAchievements, getGameAchievements };