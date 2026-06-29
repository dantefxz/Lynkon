import React, { ReactNode } from 'react';
import { render, renderHook, RenderOptions } from '@testing-library/react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import '@/i18n';

export function AllProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

export function renderWithTheme(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export function renderHookWithTheme<T>(hook: () => T) {
  return renderHook(hook, { wrapper: AllProviders });
}
