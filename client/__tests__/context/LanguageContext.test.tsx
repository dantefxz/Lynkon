import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';

// expo-localization is mocked in jest.setup.ts to return 'es'
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('LanguageContext', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('initialises with device language (es from mock)', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.language).toBe('es');
  });

  it('setLanguage changes the language to English', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await act(async () => {
      await result.current.setLanguage('en');
    });
    expect(result.current.language).toBe('en');
  });

  it('setLanguage changes the language to Japanese', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await act(async () => {
      await result.current.setLanguage('ja');
    });
    expect(result.current.language).toBe('ja');
  });

  it('setLanguage persists the choice to AsyncStorage', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await act(async () => {
      await result.current.setLanguage('en');
    });
    const stored = await AsyncStorage.getItem('app_language');
    expect(stored).toBe('en');
  });

  it('loads a stored language preference on mount', async () => {
    await AsyncStorage.setItem('app_language', 'ja');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.language).toBe('ja');
  });

  it('falls back to "es" when stored value is unsupported', async () => {
    await AsyncStorage.setItem('app_language', 'fr');
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.language).toBe('es');
  });

  it('throws when used outside LanguageProvider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useLanguage())).toThrow(
      'useLanguage must be used within LanguageProvider',
    );
    (console.error as jest.Mock).mockRestore();
  });
});
