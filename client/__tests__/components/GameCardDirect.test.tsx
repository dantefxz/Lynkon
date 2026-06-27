import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { GameCard } from '@/components/GameCard';
import { renderWithTheme } from '../setup/testUtils';

const base = {
  id: 'g1',
  name: 'Halo Infinite',
  cover: 'https://example.com/cover.jpg',
  totalHours: 50,
  totalAchievements: 20,
  completedAchievements: 10,
  width: 160,
  onPress: jest.fn(),
};

describe('GameCard (direct)', () => {
  it('renders the game name', () => {
    const { getByText } = renderWithTheme(<GameCard {...base} />);
    expect(getByText('Halo Infinite')).toBeTruthy();
  });

  it('calls onPress when card is tapped', () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithTheme(<GameCard {...base} onPress={onPress} />);
    const { TouchableOpacity } = require('react-native');
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows achievement stats', () => {
    const { getByText } = renderWithTheme(<GameCard {...base} />);
    expect(getByText('10/20 · 50%')).toBeTruthy();
  });

  it('rounds completion percentage', () => {
    const { getByText } = renderWithTheme(
      <GameCard {...base} totalAchievements={3} completedAchievements={1} />,
    );
    expect(getByText('1/3 · 33%')).toBeTruthy();
  });

  it('shows trophy badge when 100% complete', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(
      <GameCard {...base} totalAchievements={10} completedAchievements={10} />,
    );
    const { View } = require('react-native');
    const views = UNSAFE_getAllByType(View);
    // Trophy badge uses colors.warning background
    const trophyBadge = views.find((v: any) => {
      const styles: any[] = [v.props.style].flat();
      return styles.some((s: any) => s?.backgroundColor === '#EAB308');
    });
    expect(trophyBadge).toBeDefined();
  });

  it('does not show trophy badge when not 100% complete', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(<GameCard {...base} />);
    const { View } = require('react-native');
    const views = UNSAFE_getAllByType(View);
    const trophyBadge = views.find((v: any) => {
      const styles: any[] = [v.props.style].flat();
      return styles.some((s: any) => s?.backgroundColor === '#EAB308');
    });
    expect(trophyBadge).toBeUndefined();
  });

  it('renders remove button and calls onRemove when pressed', () => {
    const onRemove = jest.fn();
    const { UNSAFE_getAllByType } = renderWithTheme(
      <GameCard {...base} onRemove={onRemove} />,
    );
    const { TouchableOpacity } = require('react-native');
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[buttons.length - 1]);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('does not show hours for xbox platform', () => {
    const { queryByText } = renderWithTheme(
      <GameCard {...base} platform="xbox" totalAchievements={0} completedAchievements={0} />,
    );
    expect(queryByText(/50/)).toBeNull();
  });

  it('shows hours when achievements are zero and platform is not xbox', () => {
    const { getByText } = renderWithTheme(
      <GameCard {...base} totalAchievements={0} completedAchievements={0} />,
    );
    expect(getByText(/50/)).toBeTruthy();
  });
});
