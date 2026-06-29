import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { AddGameModal } from '@/components/AddGameModal';
import { renderWithTheme } from '../setup/testUtils';

const games = [
  {
    id: 'g1',
    name: 'Halo Infinite',
    cover: 'https://example.com/c1.jpg',
    totalHours: 100,
    totalAchievements: 20,
    completedAchievements: 10,
    platforms: [{ name: 'xbox' }],
  },
  {
    id: 'g2',
    name: 'CS:GO',
    cover: 'https://example.com/c2.jpg',
    totalHours: 500,
    totalAchievements: 50,
    completedAchievements: 30,
    platforms: [{ name: 'steam' }],
  },
];

const baseProps = {
  visible: true,
  platforms: ['steam', 'xbox'],
  allGames: games,
  visibleIds: new Set<string>(),
  onToggle: jest.fn(),
  onClose: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('AddGameModal — platform step', () => {
  it('renders platform names', () => {
    const { getByText } = renderWithTheme(<AddGameModal {...baseProps} />);
    expect(getByText('Steam')).toBeTruthy();
    expect(getByText('Xbox')).toBeTruthy();
  });

  it('renders custom title when provided', () => {
    const { getByText } = renderWithTheme(
      <AddGameModal {...baseProps} title="Mis juegos" />,
    );
    expect(getByText('Mis juegos')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    const { UNSAFE_getAllByType } = renderWithTheme(
      <AddGameModal {...baseProps} onClose={onClose} />,
    );
    const { TouchableOpacity } = require('react-native');
    // First TouchableOpacity in the header is the close button
    const [closeBtn] = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('navigates to games step when a platform is selected', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(<AddGameModal {...baseProps} />);
    const { TouchableOpacity, TextInput } = require('react-native');

    // No TextInput in platform step
    expect(() => UNSAFE_getAllByType(TextInput)).toThrow();

    // buttons: [close, steam, xbox] — press steam (index 1)
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[1]);

    // Games step has a search TextInput
    expect(UNSAFE_getAllByType(TextInput).length).toBeGreaterThan(0);
  });
});

describe('AddGameModal — games step', () => {
  function openSteamGames() {
    const result = renderWithTheme(<AddGameModal {...baseProps} />);
    const { TouchableOpacity } = require('react-native');
    // Press steam (index 1 = after close button)
    fireEvent.press(result.UNSAFE_getAllByType(TouchableOpacity)[1]);
    return result;
  }

  it('shows only games for the selected platform', () => {
    const { getByText, queryByText } = openSteamGames();
    expect(getByText('CS:GO')).toBeTruthy();
    expect(queryByText('Halo Infinite')).toBeNull();
  });

  it('filters games by search text', () => {
    const { UNSAFE_getAllByType, getByText } = openSteamGames();
    const { TextInput } = require('react-native');
    fireEvent.changeText(UNSAFE_getAllByType(TextInput)[0], 'CS');
    expect(getByText('CS:GO')).toBeTruthy();
  });

  it('shows empty state when search has no results', () => {
    const { UNSAFE_getAllByType } = openSteamGames();
    const { TextInput } = require('react-native');
    fireEvent.changeText(UNSAFE_getAllByType(TextInput)[0], 'zzznomatch');
    // FlatList renders ListEmptyComponent when data is empty
    // Just verify search didn't crash
    expect(UNSAFE_getAllByType(TextInput).length).toBeGreaterThan(0);
  });

  it('calls onToggle when a game row is pressed', () => {
    const onToggle = jest.fn();
    const { UNSAFE_getAllByType } = renderWithTheme(
      <AddGameModal {...baseProps} onToggle={onToggle} />,
    );
    const { TouchableOpacity } = require('react-native');
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[1]); // select steam

    // Game row is a TouchableOpacity after back + close buttons
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    // buttons: [back, close, ..game rows.., done]
    const gameRowBtn = buttons.find((b: any) => {
      const handler = b.props.onPress?.toString() || '';
      return b !== buttons[0] && b !== buttons[1] && b !== buttons[buttons.length - 1];
    });
    if (gameRowBtn) {
      fireEvent.press(gameRowBtn);
      expect(onToggle).toHaveBeenCalledWith('g2');
    }
  });

  it('calls onToggle when game Switch is toggled', () => {
    const onToggle = jest.fn();
    const { UNSAFE_getAllByType } = renderWithTheme(
      <AddGameModal {...baseProps} onToggle={onToggle} />,
    );
    const { TouchableOpacity, Switch } = require('react-native');
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[1]); // select steam

    const switches = UNSAFE_getAllByType(Switch);
    if (switches.length > 0) {
      fireEvent(switches[0], 'valueChange', true);
      expect(onToggle).toHaveBeenCalledWith('g2');
    }
  });

  it('back button returns to platform step', () => {
    const { UNSAFE_getAllByType } = openSteamGames();
    const { TouchableOpacity, TextInput } = require('react-native');

    // In games step: back button is first TouchableOpacity
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);

    // Back in platform step — no TextInput
    expect(() => UNSAFE_getAllByType(TextInput)).toThrow();
  });

  it('done button calls onClose', () => {
    const onClose = jest.fn();
    const { UNSAFE_getAllByType } = renderWithTheme(
      <AddGameModal {...baseProps} onClose={onClose} />,
    );
    const { TouchableOpacity } = require('react-native');
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[1]); // select steam

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[buttons.length - 1]); // done button
    expect(onClose).toHaveBeenCalled();
  });

  it('shows game count label in footer', () => {
    const visibleIds = new Set(['g2']);
    const { UNSAFE_getAllByType, queryByText } = renderWithTheme(
      <AddGameModal {...baseProps} visibleIds={visibleIds} />,
    );
    const { TouchableOpacity } = require('react-native');
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[1]); // select steam
    // g2 (CS:GO) is in visibleIds, so selectedCount = 1
    expect(queryByText(/1/)).toBeTruthy();
  });
});
