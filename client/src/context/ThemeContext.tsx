import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

export const darkColors = {
  background:    '#0A0A0F',
  backgroundGrad: '#12122A',
  card:          '#16162A',
  cardAlt:       '#1A1A2E',
  purple:        '#7C3AED',
  purpleLight:   '#A855F7',
  purpleMuted:   'rgba(124, 58, 237, 0.2)',
  purpleDim:     'rgba(124, 58, 237, 0.15)',
  purpleBorder:  'rgba(124, 58, 237, 0.3)',
  text:          '#FFFFFF',
  textMuted:     '#9CA3AF',
  textSecondary: '#C4B5FD',
  online:        '#22C55E',
  error:         '#EF4444',
  warning:       '#EAB308',
  border:        'rgba(124, 58, 237, 0.2)',
  cardBorder:    'rgba(124, 58, 237, 0.25)',
} as const;

export const lightColors = {
  background:    '#F4F4F8',
  backgroundGrad: '#EAEAF5',
  card:          '#FFFFFF',
  cardAlt:       '#F0F0FA',
  purple:        '#7C3AED',
  purpleLight:   '#A855F7',
  purpleMuted:   'rgba(124, 58, 237, 0.1)',
  purpleDim:     'rgba(124, 58, 237, 0.08)',
  purpleBorder:  'rgba(124, 58, 237, 0.25)',
  text:          '#0F0F1A',
  textMuted:     '#6B7280',
  textSecondary: '#5B21B6',
  online:        '#16A34A',
  error:         '#DC2626',
  warning:       '#D97706',
  border:        'rgba(124, 58, 237, 0.15)',
  cardBorder:    'rgba(124, 58, 237, 0.2)',
} as const;

export type AppColors = { [K in keyof typeof darkColors]: string };

const THEME_STORAGE_KEY = 'app_theme';

interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  colors: AppColors;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setTheme(stored);
    }).catch(() => {});
  }, []);

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  const ctxValue = useMemo(() => ({ theme, toggleTheme, colors }), [theme, toggleTheme, colors]);

  return (
    <ThemeContext.Provider value={ctxValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
