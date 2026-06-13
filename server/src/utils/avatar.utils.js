const AVATAR_IDS = [
  'avatar_01',
  'avatar_02',
  'avatar_03',
  'avatar_04',
  'avatar_05',
  'avatar_06',
  'avatar_07',
  'avatar_08',
];

const seedHash = (seed) => {
  const text = String(seed || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const normalizeAvatarId = (avatarId, seed = '') => {
  if (avatarId && AVATAR_IDS.includes(avatarId)) return avatarId;
  return AVATAR_IDS[seedHash(seed || avatarId || 'avatar_01') % AVATAR_IDS.length];
};

module.exports = { AVATAR_IDS, normalizeAvatarId };