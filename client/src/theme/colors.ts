export const colors = {
  // Fondos
  background:    '#0A0A0F',
  backgroundGrad: '#12122A',   // FIX: faltaba — usado en headers de settings
  card:          '#16162A',
  cardAlt:       '#1A1A2E',
 
  // Morados
  purple:        '#7C3AED',
  purpleLight:   '#A855F7',
  purpleMuted:   'rgba(124, 58, 237, 0.2)',
  purpleDim:     'rgba(124, 58, 237, 0.15)', // FIX: faltaba — usado en avatares y placeholders
  purpleBorder:  'rgba(124, 58, 237, 0.3)',
 
  // Texto
  text:          '#FFFFFF',
  textMuted:     '#9CA3AF',
  textSecondary: '#C4B5FD',
 
  // Estado
  online:        '#22C55E',
  error:         '#EF4444',
  warning:       '#EAB308',
 
  // Bordes
  border:        'rgba(124, 58, 237, 0.2)',
  cardBorder:    'rgba(124, 58, 237, 0.25)', // FIX: faltaba — el token más usado en la app
} as const;
 
export const gradients = {
  header:   ['rgba(124,58,237,0.3)', '#0A0A0F'] as const,
  card:     ['rgba(124,58,237,0.1)', '#16162A'] as const,
  button:   ['#7C3AED', '#6D28D9'] as const,
};
 
export type AppColors = typeof colors;
