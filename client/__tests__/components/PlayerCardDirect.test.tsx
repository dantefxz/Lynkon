import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { PlayerCard } from '@/components/PlayerCard';
import { renderWithTheme } from '../setup/testUtils';

describe('PlayerCard (direct)', () => {
  it('renders the player name', () => {
    const { getByText } = renderWithTheme(
      <PlayerCard id="u1" name="XGamer99" />,
    );
    expect(getByText('XGamer99')).toBeTruthy();
  });

  it('calls onPress when card is tapped', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(
      <PlayerCard id="u1" name="Alice" onPress={onPress} />,
    );
    fireEvent.press(getByText('Alice'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows games in common when count > 0', () => {
    const { getByText } = renderWithTheme(
      <PlayerCard id="u1" name="Bob" gamesInCommon={3} />,
    );
    expect(getByText(/3 juegos en común/)).toBeTruthy();
  });

  it('uses singular form for 1 game in common', () => {
    const { getByText } = renderWithTheme(
      <PlayerCard id="u1" name="Carol" gamesInCommon={1} />,
    );
    expect(getByText(/1 juego en común/)).toBeTruthy();
  });

  it('does not show games in common when count is 0', () => {
    const { queryByText } = renderWithTheme(
      <PlayerCard id="u1" name="Dave" gamesInCommon={0} />,
    );
    expect(queryByText(/juego/)).toBeNull();
  });

  it('renders action button when onAction is provided', () => {
    const { getByText } = renderWithTheme(
      <PlayerCard id="u1" name="Eve" actionLabel="Añadir" onAction={jest.fn()} />,
    );
    expect(getByText('Añadir')).toBeTruthy();
  });

  it('calls onAction when action button is pressed', () => {
    const onAction = jest.fn();
    const { getByText } = renderWithTheme(
      <PlayerCard id="u1" name="Frank" actionLabel="Seguir" onAction={onAction} />,
    );
    fireEvent.press(getByText('Seguir'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('shows online dot when isOnline=true', () => {
    const { getByText } = renderWithTheme(
      <PlayerCard id="u1" name="Grace" isOnline={true} />,
    );
    expect(getByText('Grace')).toBeTruthy();
  });

  it('applies 0.5 opacity when disabled', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <PlayerCard id="u1" name="Hank" disabled />,
    );
    const { TouchableOpacity } = require('react-native');
    const card = UNSAFE_getByType(TouchableOpacity);
    const styles: any[] = [card.props.style].flat();
    const opacity = styles.find((s: any) => s?.opacity !== undefined)?.opacity;
    expect(opacity).toBe(0.5);
  });

  it('does not render action button when onAction is not provided', () => {
    const { queryByText } = renderWithTheme(
      <PlayerCard id="u1" name="Ivy" actionLabel="Ver perfil" />,
    );
    // No onAction → button not rendered
    expect(queryByText('Ver perfil')).toBeNull();
  });
});
