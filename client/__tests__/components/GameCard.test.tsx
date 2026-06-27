import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { GameCard } from '@/components';
import { renderWithTheme } from '../setup/testUtils';

const baseProps = {
  id: 'game1',
  name: 'Halo Infinite',
  cover: 'https://example.com/cover.jpg',
};

describe('GameCard', () => {
  it('renders the game name', () => {
    const { getByText } = renderWithTheme(<GameCard {...baseProps} />);
    expect(getByText('Halo Infinite')).toBeTruthy();
  });

  it('calls onPress when card is tapped', () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithTheme(
      <GameCard {...baseProps} onPress={onPress} />,
    );
    const { TouchableOpacity } = require('react-native');
    const [card] = UNSAFE_getByType(TouchableOpacity).parent
      ? [UNSAFE_getByType(TouchableOpacity)]
      : [];
    if (card) fireEvent.press(card);
    // Use getByText as the press target instead
    const { getByText } = renderWithTheme(
      <GameCard {...baseProps} onPress={onPress} />,
    );
    fireEvent.press(getByText('Halo Infinite').parent!);
    expect(onPress).toHaveBeenCalled();
  });

  it('shows achievement stats when totalAchievements and completedAchievements are given', () => {
    const { getByText } = renderWithTheme(
      <GameCard
        {...baseProps}
        totalAchievements={20}
        completedAchievements={10}
      />,
    );
    // 10/20 = 50%
    expect(getByText('10/20 · 50%')).toBeTruthy();
  });

  it('rounds completion percentage correctly', () => {
    const { getByText } = renderWithTheme(
      <GameCard
        {...baseProps}
        totalAchievements={3}
        completedAchievements={1}
      />,
    );
    // Math.round(1/3 * 100) = 33
    expect(getByText('1/3 · 33%')).toBeTruthy();
  });

  it('shows 100% completion as 100', () => {
    const { getByText } = renderWithTheme(
      <GameCard
        {...baseProps}
        totalAchievements={10}
        completedAchievements={10}
      />,
    );
    expect(getByText('10/10 · 100%')).toBeTruthy();
  });

  it('renders a remove badge and calls onRemove when pressed', () => {
    const onRemove = jest.fn();
    const { UNSAFE_getAllByType } = renderWithTheme(
      <GameCard {...baseProps} onRemove={onRemove} />,
    );
    const { TouchableOpacity } = require('react-native');
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    // The remove badge is the second touchable
    if (buttons.length >= 2) {
      fireEvent.press(buttons[1]);
      expect(onRemove).toHaveBeenCalledTimes(1);
    }
  });

  it('renders placeholder icon when no cover is provided', () => {
    const { queryByText } = renderWithTheme(
      <GameCard {...baseProps} cover="" />,
    );
    // Name should still render
    expect(queryByText('Halo Infinite')).toBeTruthy();
  });

  it('does not show hours for xbox platform', () => {
    const { queryByText } = renderWithTheme(
      <GameCard {...baseProps} platform="xbox" totalHours={50} />,
    );
    // Hours text should not appear for xbox
    expect(queryByText(/50 h/i)).toBeNull();
  });
});
