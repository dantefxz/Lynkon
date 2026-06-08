import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Theme = 'dark' | 'light';

interface Colors {
  background: string;
  backgroundGrad: string;
  card: string;
  cardAlt: string;
  cardBorder: string;
  border: string;
  text: string;
  textMuted: string;
  purple: string;
  purpleLight: string;
  purpleMuted: string;
  purpleDim: string;
  purpleBorder: string;
  warning: string;
}

const darkColors: Colors = {
  background: '#0D0D14',
  backgroundGrad: '#12121C',
  card: '#16161F',
  cardAlt: '#1C1C2A',
  cardBorder: '#2A2A3D',
  border: '#2A2A3D',
  text: '#FFFFFF',
  textMuted: '#8888AA',
  purple: '#A855F7',
  purpleLight: '#C084FC',
  purpleMuted: '#2D1B4E',
  purpleDim: '#1E1030',
  purpleBorder: '#5B21B6',
  warning: '#F59E0B',
};

const lightColors: Colors = {
  background: '#F5F5FA',
  backgroundGrad: '#EEEEF5',
  card: '#FFFFFF',
  cardAlt: '#EDEDF5',
  cardBorder: '#DDDDEE',
  border: '#DDDDEE',
  text: '#111111',
  textMuted: '#666688',
  purple: '#7C3AED',
  purpleLight: '#A855F7',
  purpleMuted: '#EDE9FE',
  purpleDim: '#F5F3FF',
  purpleBorder: '#C4B5FD',
  warning: '#D97706',
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: Colors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: theme === 'dark' ? darkColors : lightColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
