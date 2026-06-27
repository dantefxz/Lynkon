import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { AppButton } from '@/components';
import { renderWithTheme } from '../setup/testUtils';

describe('AppButton', () => {
  it('renders the label', () => {
    const { getByText } = renderWithTheme(
      <AppButton label="Press me" onPress={jest.fn()} />,
    );
    expect(getByText('Press me')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(
      <AppButton label="Tap" onPress={onPress} />,
    );
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has disabled prop set when disabled=true', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <AppButton label="Disabled" onPress={jest.fn()} disabled />,
    );
    const { TouchableOpacity } = require('react-native');
    const btn = UNSAFE_getByType(TouchableOpacity);
    expect(btn.props.disabled).toBe(true);
  });

  it('has disabled prop set when loading=true', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <AppButton label="Loading" onPress={jest.fn()} loading />,
    );
    const { TouchableOpacity } = require('react-native');
    const btn = UNSAFE_getByType(TouchableOpacity);
    expect(btn.props.disabled).toBe(true);
  });

  it('shows ActivityIndicator and hides label when loading', () => {
    const { queryByText, UNSAFE_getByType } = renderWithTheme(
      <AppButton label="Loading" onPress={jest.fn()} loading />,
    );
    expect(queryByText('Loading')).toBeNull();
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('has opacity 0.6 when disabled', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <AppButton label="Disabled" onPress={jest.fn()} disabled />,
    );
    const { TouchableOpacity } = require('react-native');
    const btn = UNSAFE_getByType(TouchableOpacity);
    const styles: any[] = [btn.props.style].flat();
    const opacity = styles.find((s: any) => s?.opacity !== undefined)?.opacity;
    expect(opacity).toBe(0.6);
  });

  it('primary variant applies purple background', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <AppButton label="Primary" onPress={jest.fn()} variant="primary" />,
    );
    const { TouchableOpacity } = require('react-native');
    const btn = UNSAFE_getByType(TouchableOpacity);
    const styles: any[] = [btn.props.style].flat();
    const bg = styles.find((s: any) => s?.backgroundColor)?.backgroundColor;
    expect(bg).toBe('#7C3AED');
  });

  it('destructive variant applies red background', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <AppButton label="Delete" onPress={jest.fn()} variant="destructive" />,
    );
    const { TouchableOpacity } = require('react-native');
    const btn = UNSAFE_getByType(TouchableOpacity);
    const styles: any[] = [btn.props.style].flat();
    const bg = styles.find((s: any) => s?.backgroundColor)?.backgroundColor;
    expect(bg).toBe('#EF4444');
  });
});
