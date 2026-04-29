/**
 * DTOs de Platform
 *
 * Modelo de credenciales por plataforma:
 * ┌──────────┬──────────────────────────────┬──────────────────────────────────────┐
 * │Plataforma│ Key del servidor (.env)       │ Credencial del usuario (Firestore)   │
 * ├──────────┼──────────────────────────────┼──────────────────────────────────────┤
 * │ Steam    │ STEAM_API_KEY  (dev key)      │ steamId     (ID público del perfil)  │
 * │ Xbox     │ XBL_API_KEY    (dev key xbl)  │ xuid        (ID de Xbox Live)        │
 * │ PSN      │ ❌ no hay                     │ npssoToken  (token personal cifrado) │
 * └──────────┴──────────────────────────────┴──────────────────────────────────────┘
 *
 * Las dev keys del servidor van en .env y son globales para todos los usuarios.
 * La credencial del usuario se guarda en Firestore y se usa en cada request.
 */

const SUPPORTED_PLATFORMS = ['steam', 'psn', 'xbox'];

/** Describe qué campo aporta el usuario al vincular cada plataforma */
const PLATFORM_CREDENTIAL_FIELD = {
  steam: 'steamId',     // ej: "76561198xxxxxxxxx"
  xbox:  'xuid',        // ej: "2535xxxxxxxxxxxxxxx"
  psn:   'npssoToken',  // token de 64 chars obtenido desde cookies de PSN
};

/**
 * @typedef {Object} LinkPlatformDTO
 * @property {'steam'|'psn'|'xbox'} platform
 * @property {string} platformUserId  - Credencial del usuario para esa plataforma
 */
const parseLinkPlatformDTO = (body) => {
  const errors = [];
  const { platform, platformUserId } = body;

  if (!platform)
    errors.push('platform is required');
  else if (!SUPPORTED_PLATFORMS.includes(platform))
    errors.push(`platform must be one of: ${SUPPORTED_PLATFORMS.join(', ')}`);

  if (!platformUserId) {
    const hint = platform ? ` (for ${platform} this is your ${PLATFORM_CREDENTIAL_FIELD[platform]})` : '';
    errors.push(`platformUserId is required${hint}`);
  }

  if (errors.length) return { data: null, errors };
  return { data: { platform, platformUserId }, errors: [] };
};

/**
 * Serializa una plataforma vinculada sin exponer el npssoToken de PSN.
 */
const serializeLinkedPlatform = ({ platform, platformUserId, linkedAt }) => ({
  platform,
  platformUserId: platform === 'psn' ? '[LINKED]' : platformUserId,
  linkedAt,
});

module.exports = {
  parseLinkPlatformDTO,
  serializeLinkedPlatform,
  SUPPORTED_PLATFORMS,
  PLATFORM_CREDENTIAL_FIELD,
};
