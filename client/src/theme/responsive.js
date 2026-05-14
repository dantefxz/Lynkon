// src/theme/responsive.js
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base de diseño: iPhone 14 (390 x 844)
const BASE_WIDTH  = 390;
const BASE_HEIGHT = 844;

/**
 * Escala horizontal — para anchos, padding horizontal, tamaños de iconos
 */
export const wp = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;

/**
 * Escala vertical — para alturas, padding vertical, márgenes verticales
 */
export const hp = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

/**
 * Escala de fuente — con límite para que no crezca demasiado en tablets
 */
export const fs = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  // Límite: no más de 1.3x el tamaño base en pantallas grandes
  return Math.round(PixelRatio.roundToNearestPixel(Math.min(newSize, size * 1.3)));
};

/**
 * Escala moderada — mezcla entre escala completa y tamaño fijo
 * factor 0 = tamaño fijo, factor 1 = escala completa
 */
export const ms = (size, factor = 0.5) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(PixelRatio.roundToNearestPixel(size + (scale - 1) * size * factor));
};

// Breakpoints
export const isSmallScreen  = SCREEN_WIDTH < 360;  // iPhone SE, Galaxy A series
export const isMediumScreen = SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 414;
export const isLargeScreen  = SCREEN_WIDTH >= 414;  // iPhone Plus, Pro Max
export const isTablet       = SCREEN_WIDTH >= 768;

// Valores comunes pre-calculados
export const screen = {
  width:   SCREEN_WIDTH,
  height:  SCREEN_HEIGHT,
  padding: wp(16),
  radius:  ms(14),
};
