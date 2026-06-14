import type { ImageSourcePropType } from 'react-native';

export const AVATAR_IDS = [
  'avatar_01',
  'avatar_02',
  'avatar_03',
  'avatar_04',
  'avatar_05',
  'avatar_06',
  'avatar_07',
  'avatar_08',
] as const;

export type AvatarId = typeof AVATAR_IDS[number];

const DEFAULT_AVATAR_ID: AvatarId = 'avatar_01';

export const AVATAR_SOURCES: Record<AvatarId, ImageSourcePropType> = {
  avatar_01: require('../../assets/avatars/LSW_ProfileIcons_R2D2.png'),
  avatar_02: require('../../assets/avatars/LSW_PhotoIcons_CountDooku.png'),
  avatar_03: require('../../assets/avatars/LSW_ProfileIcons_DarthVader.png'),
  avatar_04: require('../../assets/avatars/LSW_ProfileIcons_Rey_Dark_Ep9.png'),
  avatar_05: require('../../assets/avatars/LSW_PhotoIcons_MaceWindu.png'),
  avatar_06: require('../../assets/avatars/LSW_ProfileIcons_Anakin_JediKnight.png'),
  avatar_07: require('../../assets/avatars/LSW_ProfileIcons_Luke_Black.png'),
  avatar_08: require('../../assets/avatars/LSW_ProfileIcons_ObiWan_JediKnight_Robe.png'),
};

const seedHash = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getAvatarIdForSeed = (seed: string): AvatarId => {
  const normalizedSeed = seed?.trim() || DEFAULT_AVATAR_ID;
  return AVATAR_IDS[seedHash(normalizedSeed) % AVATAR_IDS.length];
};

export const normalizeAvatarId = (avatarId?: string | null, seed = ''): AvatarId => {
  if (avatarId && AVATAR_IDS.includes(avatarId as AvatarId)) {
    return avatarId as AvatarId;
  }
  return getAvatarIdForSeed(seed);
};

export const resolveAvatarSource = (avatarId?: string | null, seed = ''): ImageSourcePropType => {
  return AVATAR_SOURCES[normalizeAvatarId(avatarId, seed)];
};