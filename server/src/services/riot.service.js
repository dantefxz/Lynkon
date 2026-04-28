/**
 * Riot Games Service — League of Legends
 * Dev key del servidor : process.env.RIOT_API_KEY  (global, en .env)
 * Credencial del usuario: puuid  (guardado en Firestore, provisto por el usuario al vincular)
 *
 * Obtener el puuid: desde el cliente React Native, el usuario busca su summoner name
 * y se obtiene el puuid via GET /lol/summoner/v4/summoners/by-name/{summonerName}
 */
const axios = require('axios');

const REGION   = () => process.env.RIOT_REGION || 'la1';
const CLUSTER  = 'americas';
const DEV_KEY  = () => process.env.RIOT_API_KEY;
const headers  = () => ({ 'X-Riot-Token': DEV_KEY() });
const riotUrl  = (path) => `https://${REGION()}.api.riotgames.com${path}`;
const clusterUrl = (path) => `https://${CLUSTER}.api.riotgames.com${path}`;

/** @param {string} puuid - de Firestore */
const getStats = async (puuid) => {
  const [sumRes, rankRes] = await Promise.all([
    axios.get(riotUrl(`/lol/summoner/v4/summoners/by-puuid/${puuid}`), { headers: headers() }),
    axios.get(riotUrl(`/lol/league/v4/entries/by-summoner/${puuid}`),  { headers: headers() })
         .catch(() => ({ data: [] })),
  ]);

  const summoner = sumRes.data;
  const soloQ    = rankRes.data.find?.((r) => r.queueType === 'RANKED_SOLO_5x5') || null;

  return {
    platform:      'riot',
    puuid,
    summonerName:  summoner.name,
    summonerLevel: summoner.summonerLevel,
    rank: soloQ ? {
      tier:   soloQ.tier,
      rank:   soloQ.rank,
      lp:     soloQ.leaguePoints,
      wins:   soloQ.wins,
      losses: soloQ.losses,
    } : null,
  };
};

/** @param {string} puuid - de Firestore */
const getGames = async (puuid) => {
  const idsRes = await axios.get(
    clusterUrl(`/lol/match/v5/matches/by-puuid/${puuid}/ids?count=20`),
    { headers: headers() }
  );

  return Promise.all(
    idsRes.data.slice(0, 10).map(async (matchId) => {
      const res         = await axios.get(clusterUrl(`/lol/match/v5/matches/${matchId}`), { headers: headers() });
      const match       = res.data;
      const participant = match.info.participants.find((p) => p.puuid === puuid);
      return {
        matchId,
        champion:     participant?.championName,
        kills:        participant?.kills,
        deaths:       participant?.deaths,
        assists:      participant?.assists,
        win:          participant?.win,
        gameMode:     match.info.gameMode,
        gameDuration: match.info.gameDuration,
        gameDate:     match.info.gameCreation,
      };
    })
  );
};

/** @param {string} puuid - de Firestore */
const getAchievements = async (puuid) => {
  const sumRes = await axios.get(
    riotUrl(`/lol/summoner/v4/summoners/by-puuid/${puuid}`),
    { headers: headers() }
  );
  const masteryRes = await axios.get(
    riotUrl(`/lol/champion-mastery/v4/champion-masteries/by-summoner/${sumRes.data.id}/top?count=5`),
    { headers: headers() }
  );
  return masteryRes.data.map((m) => ({
    championId:    m.championId,
    masteryLevel:  m.championLevel,
    masteryPoints: m.championPoints,
    lastPlayTime:  m.lastPlayTime,
  }));
};

module.exports = { getStats, getGames, getAchievements };
