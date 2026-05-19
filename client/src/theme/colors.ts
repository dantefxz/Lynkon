// Re-export darkColors as `colors` for backward-compat with static imports.
// For dynamic theming always use useTheme().colors instead.
export { darkColors as colors, lightColors, darkColors } from '@/context/ThemeContext';
export type { AppColors } from '@/context/ThemeContext';

export const gradients = {
  header:   ['rgba(124,58,237,0.3)', '#0A0A0F'] as const,
  card:     ['rgba(124,58,237,0.1)', '#16162A'] as const,
  button:   ['#7C3AED', '#6D28D9'] as const,
};
