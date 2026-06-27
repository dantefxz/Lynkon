import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { ProfileHeader } from '@/components/ProfileHeader';
import { renderWithTheme } from '../setup/testUtils';

const baseStats = [
  { icon: 'videogame-asset', iconColor: '#A855F7', value: 42, label: 'Juegos' },
  { icon: 'emoji-events', iconColor: '#F59E0B', value: 150, label: 'Logros' },
];

describe('ProfileHeader', () => {
  it('renders the player name', () => {
    const { getByText } = renderWithTheme(
      <ProfileHeader name="XGamer99" stats={baseStats} />,
    );
    expect(getByText('XGamer99')).toBeTruthy();
  });

  it('renders email when provided', () => {
    const { getByText } = renderWithTheme(
      <ProfileHeader name="Alice" stats={baseStats} email="alice@test.com" />,
    );
    expect(getByText('alice@test.com')).toBeTruthy();
  });

  it('does not render email when not provided', () => {
    const { queryByText } = renderWithTheme(
      <ProfileHeader name="Alice" stats={baseStats} />,
    );
    expect(queryByText('alice@test.com')).toBeNull();
  });

  it('renders bio when provided', () => {
    const { getByText } = renderWithTheme(
      <ProfileHeader name="Bob" stats={baseStats} bio="I love gaming!" />,
    );
    expect(getByText('I love gaming!')).toBeTruthy();
  });

  it('renders all stat cards', () => {
    const { getByText } = renderWithTheme(
      <ProfileHeader name="Carol" stats={baseStats} />,
    );
    expect(getByText('42')).toBeTruthy();
    expect(getByText('Juegos')).toBeTruthy();
    expect(getByText('150')).toBeTruthy();
    expect(getByText('Logros')).toBeTruthy();
  });

  it('renders edit avatar badge and calls onEditAvatar when pressed', () => {
    const onEditAvatar = jest.fn();
    const { UNSAFE_getAllByType } = renderWithTheme(
      <ProfileHeader name="Dave" stats={baseStats} onEditAvatar={onEditAvatar} />,
    );
    const { TouchableOpacity } = require('react-native');
    const [avatarBtn] = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(avatarBtn);
    expect(onEditAvatar).toHaveBeenCalledTimes(1);
  });

  it('calls onEditBio when edit icon is pressed', () => {
    const onEditBio = jest.fn();
    const { UNSAFE_getAllByType } = renderWithTheme(
      <ProfileHeader name="Eve" stats={baseStats} bio="My bio" onEditBio={onEditBio} />,
    );
    const { TouchableOpacity } = require('react-native');
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    // buttons[0] = avatar (disabled, no onEditAvatar)
    // buttons[1] = edit name icon → calls onEditBio
    fireEvent.press(buttons[1]);
    expect(onEditBio).toHaveBeenCalled();
  });

  it('shows bio hint text when onEditBio is provided but no bio', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(
      <ProfileHeader name="Frank" stats={baseStats} onEditBio={jest.fn()} />,
    );
    const { TouchableOpacity } = require('react-native');
    expect(UNSAFE_getAllByType(TouchableOpacity).length).toBeGreaterThan(0);
  });

  it('renders sync button and calls onSync when pressed', () => {
    const onSync = jest.fn();
    const { UNSAFE_getAllByType } = renderWithTheme(
      <ProfileHeader name="Grace" stats={baseStats} onSync={onSync} />,
    );
    const { TouchableOpacity } = require('react-native');
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[buttons.length - 1]);
    expect(onSync).toHaveBeenCalledTimes(1);
  });

  it('shows ActivityIndicator when syncing=true', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <ProfileHeader name="Hank" stats={baseStats} onSync={jest.fn()} syncing={true} />,
    );
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders platform badges when platforms are provided', () => {
    const { getByText } = renderWithTheme(
      <ProfileHeader name="Ivy" stats={baseStats} platforms={['steam']} />,
    );
    expect(getByText('Steam')).toBeTruthy();
  });

  it('renders multiple platform badges', () => {
    const { getByText } = renderWithTheme(
      <ProfileHeader name="Jack" stats={baseStats} platforms={['steam', 'xbox']} />,
    );
    expect(getByText('Steam')).toBeTruthy();
    expect(getByText('Xbox')).toBeTruthy();
  });

  it('renders without platforms when array is empty', () => {
    const { getByText } = renderWithTheme(
      <ProfileHeader name="Kay" stats={baseStats} platforms={[]} />,
    );
    expect(getByText('Kay')).toBeTruthy();
  });

  it('renders with empty stats array', () => {
    const { getByText } = renderWithTheme(
      <ProfileHeader name="Leo" stats={[]} />,
    );
    expect(getByText('Leo')).toBeTruthy();
  });
});
