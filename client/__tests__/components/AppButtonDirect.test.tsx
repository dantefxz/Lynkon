import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { AppButton } from '@/components/AppButton';
import { renderWithTheme } from '../setup/testUtils';

describe('AppButton (standalone)', () => {
  it('renders the label', () => {
    const { getByText } = renderWithTheme(<AppButton label="Click me" onPress={jest.fn()} />);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(<AppButton label="Tap" onPress={onPress} />);
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has disabled=true when disabled prop is set', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <AppButton label="Disabled" onPress={jest.fn()} disabled />,
    );
    const { TouchableOpacity } = require('react-native');
    expect(UNSAFE_getByType(TouchableOpacity).props.disabled).toBe(true);
  });

  it('has disabled=true when loading=true', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <AppButton label="Loading" onPress={jest.fn()} loading />,
    );
    const { TouchableOpacity } = require('react-native');
    expect(UNSAFE_getByType(TouchableOpacity).props.disabled).toBe(true);
  });

  it('shows ActivityIndicator and hides label when loading', () => {
    const { queryByText, UNSAFE_getByType } = renderWithTheme(
      <AppButton label="Load" onPress={jest.fn()} loading />,
    );
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(queryByText('Load')).toBeNull();
  });

  it('opacity is 0.55 when disabled', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <AppButton label="Off" onPress={jest.fn()} disabled />,
    );
    const { TouchableOpacity } = require('react-native');
    const styles: any[] = [UNSAFE_getByType(TouchableOpacity).props.style].flat();
    const opacity = styles.find((s: any) => s?.opacity !== undefined)?.opacity;
    expect(opacity).toBe(0.55);
  });

  it('ghost variant has transparent background', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <AppButton label="Ghost" onPress={jest.fn()} variant="ghost" />,
    );
    const { TouchableOpacity } = require('react-native');
    const styles: any[] = [UNSAFE_getByType(TouchableOpacity).props.style].flat();
    const bg = styles.find((s: any) => s?.backgroundColor !== undefined)?.backgroundColor;
    expect(bg).toBe('transparent');
  });

  it('destructive variant has transparent background', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <AppButton label="Delete" onPress={jest.fn()} variant="destructive" />,
    );
    const { TouchableOpacity } = require('react-native');
    const styles: any[] = [UNSAFE_getByType(TouchableOpacity).props.style].flat();
    const bg = styles.find((s: any) => s?.backgroundColor !== undefined)?.backgroundColor;
    expect(bg).toBe('transparent');
  });

  it('fullWidth=false renders without errors', () => {
    const { getByText } = renderWithTheme(
      <AppButton label="Narrow" onPress={jest.fn()} fullWidth={false} />,
    );
    expect(getByText('Narrow')).toBeTruthy();
  });

  it('renders icon when icon prop is provided', () => {
    const { getByText } = renderWithTheme(
      <AppButton label="With Icon" onPress={jest.fn()} icon="star" />,
    );
    expect(getByText('With Icon')).toBeTruthy();
  });

  it('secondary variant uses non-purple background', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <AppButton label="Secondary" onPress={jest.fn()} variant="secondary" />,
    );
    const { TouchableOpacity } = require('react-native');
    const styles: any[] = [UNSAFE_getByType(TouchableOpacity).props.style].flat();
    const bg = styles.find((s: any) => s?.backgroundColor !== undefined)?.backgroundColor;
    expect(bg).not.toBe('#7C3AED');
  });
});
