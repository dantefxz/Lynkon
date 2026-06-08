const AVATAR_BASE = 'https://api.dicebear.com/7.x/avataaars/svg?seed=';

export function getProfileAvatar(id: string): string {
  return `${AVATAR_BASE}${id}`;
}
