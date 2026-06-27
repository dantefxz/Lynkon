import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { SettingsRow, SettingsSwitchRow } from '@/components';
import { renderWithTheme } from '../setup/testUtils';

describe('SettingsRow', () => {
  it('renders the label', () => {
    const { getByText } = renderWithTheme(
      <SettingsRow label="Idioma" />,
    );
    expect(getByText('Idioma')).toBeTruthy();
  });

  it('renders a sublabel when provided', () => {
    const { getByText } = renderWithTheme(
      <SettingsRow label="Cuenta" sublabel="Gestiona tu cuenta" />,
    );
    expect(getByText('Gestiona tu cuenta')).toBeTruthy();
  });

  it('does not render sublabel when not provided', () => {
    const { queryByText } = renderWithTheme(
      <SettingsRow label="Tema" />,
    );
    expect(queryByText('Gestiona tu cuenta')).toBeNull();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(
      <SettingsRow label="Notificaciones" onPress={onPress} />,
    );
    fireEvent.press(getByText('Notificaciones'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders a value instead of chevron when provided', () => {
    const { getByText } = renderWithTheme(
      <SettingsRow label="Idioma" value="Español" />,
    );
    expect(getByText('Español')).toBeTruthy();
  });
});

describe('SettingsSwitchRow', () => {
  it('renders the label', () => {
    const { getByText } = renderWithTheme(
      <SettingsSwitchRow label="Notificaciones" value={false} onValueChange={jest.fn()} />,
    );
    expect(getByText('Notificaciones')).toBeTruthy();
  });

  it('renders the sublabel when provided', () => {
    const { getByText } = renderWithTheme(
      <SettingsSwitchRow
        label="Dark mode"
        sublabel="Usa el tema oscuro"
        value={true}
        onValueChange={jest.fn()}
      />,
    );
    expect(getByText('Usa el tema oscuro')).toBeTruthy();
  });

  it('renders a Switch with the given value', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <SettingsSwitchRow label="Toggle" value={true} onValueChange={jest.fn()} />,
    );
    const { Switch } = require('react-native');
    const sw = UNSAFE_getByType(Switch);
    expect(sw.props.value).toBe(true);
  });

  it('calls onValueChange when the switch is toggled', () => {
    const onValueChange = jest.fn();
    const { UNSAFE_getByType } = renderWithTheme(
      <SettingsSwitchRow label="Toggle" value={false} onValueChange={onValueChange} />,
    );
    const { Switch } = require('react-native');
    const sw = UNSAFE_getByType(Switch);
    fireEvent(sw, 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
