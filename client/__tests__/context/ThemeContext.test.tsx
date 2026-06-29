import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme, darkColors, lightColors } from '@/context/ThemeContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeContext', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts with dark theme by default', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('dark');
  });

  it('exposes darkColors when theme is dark', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.colors).toEqual(darkColors);
  });

  it('toggleTheme switches from dark to light', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');
  });

  it('exposes lightColors after toggle', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {
      result.current.toggleTheme();
    });
    expect(result.current.colors).toEqual(lightColors);
  });

  it('toggleTheme switches back to dark on second call', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => { result.current.toggleTheme(); });
    await act(async () => { result.current.toggleTheme(); });
    expect(result.current.theme).toBe('dark');
  });

  it('persists theme to AsyncStorage on toggle', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {
      result.current.toggleTheme();
    });
    const stored = await AsyncStorage.getItem('app_theme');
    expect(stored).toBe('light');
  });

  it('loads stored theme from AsyncStorage on mount', async () => {
    await AsyncStorage.setItem('app_theme', 'light');
    const { result } = renderHook(() => useTheme(), { wrapper });
    // Wait for the useEffect to read from storage
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.theme).toBe('light');
  });

  it('throws when used outside ThemeProvider', () => {
    // Suppress the expected console.error from React
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within ThemeProvider',
    );
    (console.error as jest.Mock).mockRestore();
  });

  it('darkColors has the required color keys', () => {
    const keys = ['background', 'card', 'purple', 'text', 'textMuted', 'error', 'online'] as const;
    keys.forEach((key) => {
      expect(darkColors[key]).toBeDefined();
    });
  });

  it('lightColors has the required color keys', () => {
    const keys = ['background', 'card', 'purple', 'text', 'textMuted', 'error', 'online'] as const;
    keys.forEach((key) => {
      expect(lightColors[key]).toBeDefined();
    });
  });
});
