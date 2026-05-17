import { ImageSourcePropType } from 'react-native';

export type PlatformId = 'steam' | 'psn' | 'xbox';

export const PLATFORM_ORDER: PlatformId[] = ['psn', 'xbox', 'steam'];

export const PLATFORM_LABELS: Record<PlatformId, string> = {
  steam: 'Steam',
  psn: 'PlayStation',
  xbox: 'Xbox',
};

export const PLATFORM_LOGOS: Record<PlatformId, ImageSourcePropType> = {
  steam: require('../../assets/plataforms/Steam.png'),
  psn: require('../../assets/plataforms/PlayStation.png'),
  xbox: require('../../assets/plataforms/Xbox.png'),
};

export const normalizePlatformId = (value?: string | null): PlatformId | null => {
  if (!value) return null;

  const normalized = value.toLowerCase();
  if (normalized === 'steam') return 'steam';
  if (normalized === 'psn' || normalized === 'playstation') return 'psn';
  if (normalized === 'xbox') return 'xbox';

  return null;
};