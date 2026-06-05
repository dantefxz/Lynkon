/**
 * DTOs de User
 */

/**
 * @typedef {Object} UpdateProfileDTO
 * @property {string}   [bio]
 * @property {string}   [avatarId]            - ID de avatar precargado (no imagen custom)
 * @property {Array}    [favoriteGames]        - [{ gameId, name, platform }]
 * @property {Object}   [skillTags]            - { "gameId": "Gold" }
 * @property {Array}    [featuredAchievements] - [{ achievementId, gameId, platform }]
 */

const ALLOWED_PROFILE_FIELDS = ['bio', 'avatarId', 'avatar', 'username', 'favoriteGames', 'skillTags', 'featuredAchievements'];

/**
 * @param {Object} body
 * @returns {{ data: UpdateProfileDTO|null, errors: string[] }}
 */
const parseUpdateProfileDTO = (body) => {
  const errors = [];
  const data = {};

  ALLOWED_PROFILE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) data[field] = body[field];
  });

  if (data.bio !== undefined && typeof data.bio !== 'string')
    errors.push('bio must be a string');
  if (data.bio && data.bio.length > 300)
    errors.push('bio cannot exceed 300 characters');

  if (data.favoriteGames !== undefined && !Array.isArray(data.favoriteGames))
    errors.push('favoriteGames must be an array');

  if (data.featuredAchievements !== undefined && !Array.isArray(data.featuredAchievements))
    errors.push('featuredAchievements must be an array');

  if (Object.keys(data).length === 0)
    errors.push('No valid fields provided');

  if (errors.length) return { data: null, errors };
  return { data, errors: [] };
};

/**
 * @typedef {Object} UpdateSettingsDTO
 * @property {boolean} [notifications]
 * @property {'public'|'friends'|'private'} [privacy]
 */

const parseUpdateSettingsDTO = (body) => {
  const errors = [];
  const { notifications, privacy } = body;
  const data = {};

  if (notifications !== undefined) {
    if (typeof notifications !== 'boolean') errors.push('notifications must be a boolean');
    else data.notifications = notifications;
  }

  if (privacy !== undefined) {
    if (!['public', 'friends', 'private'].includes(privacy))
      errors.push("privacy must be 'public', 'friends' or 'private'");
    else data.privacy = privacy;
  }

  if (Object.keys(data).length === 0) errors.push('No valid fields provided');

  if (errors.length) return { data: null, errors };
  return { data, errors: [] };
};

/**
 * Serializa el perfil de usuario para la respuesta.
 * Filtra campos sensibles si no es el owner.
 */
const serializeProfile = (userData, isOwner = false) => ({
  uid:                  userData.uid,
  username:             userData.username,
  bio:                  userData.bio || '',
  avatar:               userData.avatar || userData.avatarId || null,
  avatarId:             userData.avatarId || null,
  favoriteGames:        userData.favoriteGames || [],
  featuredAchievements: userData.featuredAchievements || [],
  skillTags:            userData.skillTags || {},
  platforms:            (userData.platforms || []).map(({ platform, platformUserId, linkedAt }) => ({
                          platform, platformUserId, linkedAt,
                        })),
  ...(isOwner && {
    email:      userData.email,
    isUnder16:  userData.isUnder16,
    birthDate:  userData.birthDate,
  }),
});

module.exports = { parseUpdateProfileDTO, parseUpdateSettingsDTO, serializeProfile, ALLOWED_PROFILE_FIELDS };
