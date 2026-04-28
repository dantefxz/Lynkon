/**
 * PSN Service
 * Dev key del servidor : ❌ no existe — PSN no provee dev keys públicas
 * Credencial del usuario: npssoToken  (guardado en Firestore, provisto por el usuario al vincular)
 *
 * El npssoToken es un token personal de 64 chars que el usuario obtiene desde
 * las cookies de su sesión de PSN en el navegador (cookie "npsso").
 * Docs: https://www.npmjs.com/package/psn-api
 *
 * Para activar: npm install psn-api y descomentar el código.
 */

// const {
//   exchangeNpssoForCode,
//   exchangeCodeForAccessToken,
//   getUserTitles,
//   getUserTrophySummary,
//   getUserTrophiesEarnedForTitle,
// } = require('psn-api');

/**
 * Intercambia el npssoToken del usuario por un accessToken de sesión.
 * @param {string} npssoToken - de Firestore (credencial personal del usuario)
 */
const getAccessToken = async (npssoToken) => {
  // const code = await exchangeNpssoForCode(npssoToken);
  // const { accessToken } = await exchangeCodeForAccessToken(code);
  // return accessToken;
  throw new Error('PSN: instalar psn-api y descomentar getAccessToken');
};

/** @param {string} npssoToken - de Firestore */
const getStats = async (npssoToken) => {
  const accessToken = await getAccessToken(npssoToken);
  // const { trophySummary } = await getUserTrophySummary({ accessToken });
  // return { platform: 'psn', trophySummary };
  throw new Error('PSN: getStats no implementado aún');
};

/** @param {string} npssoToken - de Firestore */
const getGames = async (npssoToken) => {
  const accessToken = await getAccessToken(npssoToken);
  // const { titles } = await getUserTitles({ accessToken }, 'me');
  // return titles.map(t => ({ gameId: t.titleId, name: t.name, platform: 'psn' }));
  throw new Error('PSN: getGames no implementado aún');
};

/** @param {string} npssoToken - de Firestore */
const getAchievements = async (npssoToken) => {
  const accessToken = await getAccessToken(npssoToken);
  // const trophies = await getUserTrophiesEarnedForTitle({ accessToken }, 'me', 'all');
  // return trophies;
  throw new Error('PSN: getAchievements no implementado aún');
};

module.exports = { getStats, getGames, getAchievements };
