import { getAvatarIdForSeed } from '@/constants/avatars';

export function getProfileAvatar(id: string): string {
  return getAvatarIdForSeed(id);
}
