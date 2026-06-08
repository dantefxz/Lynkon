export type PlatformId = 'steam' | 'playstation' | 'psn' | 'xbox';

export const PLATFORM_ORDER: PlatformId[] = ['steam', 'playstation', 'xbox'];

export const PLATFORM_LABELS: Record<PlatformId, string> = {
  steam: 'Steam',
  playstation: 'PlayStation',
  psn: 'PlayStation Network',
  xbox: 'Xbox',
};

export const PLATFORM_LOGOS: Record<PlatformId, any> = {
  steam: require('../../assets/plataforms/Steam.png'),
  playstation: require('../../assets/plataforms/PlayStation.png'),
  psn: require('../../assets/plataforms/PlayStation.png'),
  xbox: require('../../assets/plataforms/Xbox.png'),
};

export function normalizePlatformId(raw: string): PlatformId | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (lower.includes('steam')) return 'steam';
  if (lower === 'psn' || lower.includes('playstation') || lower.includes('ps')) return 'psn';
  if (lower.includes('xbox') || lower.includes('microsoft')) return 'xbox';
  return null;
}
