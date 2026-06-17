import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const SCREEN_WIDTH = SCREEN_W;
export const SCREEN_HEIGHT = SCREEN_H;
const BASE_W = 390;
const BASE_H = 844;

export function rw(size: number): number {
  return PixelRatio.roundToNearestPixel((size / BASE_W) * SCREEN_W);
}

export function rh(size: number): number {
  return PixelRatio.roundToNearestPixel((size / BASE_H) * SCREEN_H);
}

export function rf(size: number): number {
  const scaled = (size / BASE_W) * SCREEN_W;
  return PixelRatio.roundToNearestPixel(Math.min(scaled, size * 1.3));
}

export const rs = {
  xs: rw(4),
  sm: rw(8),
  md: rw(16),
  lg: rw(24),
  xl: rw(32),
  xxl: rw(48),
};

export function gridColumns(): number {
  if (SCREEN_W >= 768) return 4;
  if (SCREEN_W >= 500) return 3;
  return 2;
}

export function cardWidth(cols: number): number {
  const totalPadding = rw(16) * 2;
  const totalGap = rw(12) * (cols - 1);
  return (SCREEN_W - totalPadding - totalGap) / cols;
}
