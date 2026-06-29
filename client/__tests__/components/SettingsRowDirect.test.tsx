import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { SettingsRow, SettingsSwitchRow } from '@/components/SettingsRow';
import { renderWithTheme } from '../setup/testUtils';

describe('SettingsRow (direct)', () => {
  it('renders the label', () => {
    const { getByText } = renderWithTheme(
      <SettingsRow label="Idioma" onPress={jest.fn()} />,
    );
    expect(getByText('Idioma')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(
      <SettingsRow label="Cuenta" onPress={onPress} />,
    );
    fireEvent.press(getByText('Cuenta'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders value text when provided', () => {
    const { getByText } = renderWithTheme(
      <SettingsRow label="Idioma" value="Español" onPress={jest.fn()} />,
    );
    expect(getByText('Español')).toBeTruthy();
  });

  it('does not render value when not provided', () => {
    const { queryByText } = renderWithTheme(
      <SettingsRow label="Tema" onPress={jest.fn()} />,
    );
    expect(queryByText('Español')).toBeNull();
  });

  it('renders emoji icon when provided', () => {
    const { getByText } = renderWithTheme(
      <SettingsRow label="Región" emoji="🌍" onPress={jest.fn()} />,
    );
    expect(getByText('🌍')).toBeTruthy();
  });

  it('renders icon via name when provided', () => {
    const { getByText } = renderWithTheme(
      <SettingsRow label="Seguridad" icon="lock" onPress={jest.fn()} />,
    );
    expect(getByText('Seguridad')).toBeTruthy();
  });

  it('renders iconImage when provided', () => {
    const { getByText, UNSAFE_getByType } = renderWithTheme(
      <SettingsRow
        label="Plataforma"
        iconImage={{ uri: 'https://example.com/icon.png' }}
        onPress={jest.fn()}
      />,
    );
    expect(getByText('Plataforma')).toBeTruthy();
    const { Image } = require('react-native');
    expect(UNSAFE_getByType(Image)).toBeTruthy();
  });

  it('shows divider when showDivider=true', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(
      <SettingsRow label="Conta" onPress={jest.fn()} showDivider />,
    );
    const { View } = require('react-native');
    const views = UNSAFE_getAllByType(View);
    // Divider is a View with height: 1
    const divider = views.find((v: any) => {
      const styles: any[] = [v.props.style].flat();
      return styles.some((s: any) => s?.height === 1);
    });
    expect(divider).toBeDefined();
  });

  it('value starting with "●" uses online color', () => {
    const { getByText } = renderWithTheme(
      <SettingsRow label="Estado" value="● Online" onPress={jest.fn()} />,
    );
    const textEl = getByText('● Online');
    const styles: any[] = [textEl.props.style].flat();
    const onlineStyle = styles.find((s: any) => s?.color === '#22C55E');
    expect(onlineStyle).toBeDefined();
  });
});

describe('SettingsSwitchRow (direct)', () => {
  it('renders the label', () => {
    const { getByText } = renderWithTheme(
      <SettingsSwitchRow icon="notifications" label="Notificaciones" value={false} onValueChange={jest.fn()} />,
    );
    expect(getByText('Notificaciones')).toBeTruthy();
  });

  it('renders a Switch with the given value', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <SettingsSwitchRow icon="dark-mode" label="Dark mode" value={true} onValueChange={jest.fn()} />,
    );
    const { Switch } = require('react-native');
    expect(UNSAFE_getByType(Switch).props.value).toBe(true);
  });

  it('calls onValueChange when switch is toggled', () => {
    const onValueChange = jest.fn();
    const { UNSAFE_getByType } = renderWithTheme(
      <SettingsSwitchRow icon="wifi" label="Wifi" value={false} onValueChange={onValueChange} />,
    );
    const { Switch } = require('react-native');
    fireEvent(UNSAFE_getByType(Switch), 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('shows divider when showDivider=true', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(
      <SettingsSwitchRow icon="star" label="Favoritos" value={false} onValueChange={jest.fn()} showDivider />,
    );
    const { View } = require('react-native');
    const views = UNSAFE_getAllByType(View);
    const divider = views.find((v: any) => {
      const styles: any[] = [v.props.style].flat();
      return styles.some((s: any) => s?.height === 1);
    });
    expect(divider).toBeDefined();
  });
});
