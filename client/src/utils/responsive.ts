import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Base design size (standard phone ~375×812)
const BASE_W = 375;
const BASE_H = 812;

/**
 * Scale a size proportionally to screen width.
 * Use for horizontal measurements: padding, margin, icon sizes, font sizes.
 */
export function rw(size: number): number {
  return Math.round((SCREEN_W / BASE_W) * size);
}

/**
 * Scale a size proportionally to screen height.
 * Use for vertical measurements: heights, vertical padding.
 */
export function rh(size: number): number {
  return Math.round((SCREEN_H / BASE_H) * size);
}

/**
 * Responsive font size — scales with width but caps at 1.3× to avoid
 * giant text on tablets.
 */
export function rf(size: number): number {
  const scale = SCREEN_W / BASE_W;
  const capped = Math.min(scale, 1.3);
  return Math.round(PixelRatio.roundToNearestPixel(size * capped));
}

/**
 * Responsive spacing — shorthand for common spacing values.
 */
export const rs = {
  xs: rw(4),
  sm: rw(8),
  md: rw(16),
  lg: rw(24),
  xl: rw(32),
  xxl: rw(48),
};

/** Is this a tablet-sized device (width ≥ 600dp)? */
export const isTablet = SCREEN_W >= 600;

/** Screen dimensions — import instead of calling Dimensions every file. */
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = { width: SCREEN_W, height: SCREEN_H };

/**
 * Returns the number of grid columns based on screen width.
 * phones → 2, large phones → 2, tablets → 3, big tablets → 4
 */
export function gridColumns(): number {
  if (SCREEN_W >= 900) return 4;
  if (SCREEN_W >= 600) return 3;
  return 2;
}

/**
 * Card width for a grid with `cols` columns, given horizontal padding and gap.
 */
export function cardWidth(cols: number, hPadding = rw(16), gap = rw(12)): number {
  return (SCREEN_W - hPadding * 2 - gap * (cols - 1)) / cols;
}
