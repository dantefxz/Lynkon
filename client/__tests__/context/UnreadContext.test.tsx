import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { UnreadProvider, useUnread } from '@/context/UnreadContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UnreadProvider>{children}</UnreadProvider>
);

describe('UnreadContext', () => {
  it('starts with unreadConvCount of 0', () => {
    const { result } = renderHook(() => useUnread(), { wrapper });
    expect(result.current.unreadConvCount).toBe(0);
  });

  it('setUnreadConvCount updates the count', () => {
    const { result } = renderHook(() => useUnread(), { wrapper });
    act(() => {
      result.current.setUnreadConvCount(5);
    });
    expect(result.current.unreadConvCount).toBe(5);
  });

  it('setUnreadConvCount can be set to 0', () => {
    const { result } = renderHook(() => useUnread(), { wrapper });
    act(() => { result.current.setUnreadConvCount(10); });
    act(() => { result.current.setUnreadConvCount(0); });
    expect(result.current.unreadConvCount).toBe(0);
  });

  it('multiple calls update correctly', () => {
    const { result } = renderHook(() => useUnread(), { wrapper });
    act(() => { result.current.setUnreadConvCount(3); });
    act(() => { result.current.setUnreadConvCount(7); });
    expect(result.current.unreadConvCount).toBe(7);
  });

  it('useUnread returns default values outside provider (default context)', () => {
    // UnreadContext has a default value, so it should NOT throw
    const { result } = renderHook(() => useUnread());
    expect(result.current.unreadConvCount).toBe(0);
    expect(typeof result.current.setUnreadConvCount).toBe('function');
  });
});
