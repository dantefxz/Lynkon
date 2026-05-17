import React, { createContext, useContext, useState, ReactNode } from 'react';
import { colors } from '@/theme/colors';

// For now the app is always dark — the toggle is wired but both point to
// the same palette. Swap lightColors for a real light palette when needed.
interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  colors: typeof colors;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
