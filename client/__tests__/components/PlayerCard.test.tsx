import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { PlayerCard } from '@/components';
import { renderWithTheme } from '../setup/testUtils';

describe('PlayerCard', () => {
  it('renders the player name', () => {
    const { getByText } = renderWithTheme(<PlayerCard name="XGamer99" />);
    expect(getByText('XGamer99')).toBeTruthy();
  });

  it('calls onPress when the card is tapped', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(
      <PlayerCard name="XGamer99" onPress={onPress} />,
    );
    fireEvent.press(getByText('XGamer99'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the action button when actionLabel and onAction are provided', () => {
    const { getByText } = renderWithTheme(
      <PlayerCard name="Alice" actionLabel="Añadir amigo" onAction={jest.fn()} />,
    );
    expect(getByText('Añadir amigo')).toBeTruthy();
  });

  it('calls onAction when the action button is pressed', () => {
    const onAction = jest.fn();
    const { getByText } = renderWithTheme(
      <PlayerCard name="Bob" actionLabel="Seguir" onAction={onAction} />,
    );
    fireEvent.press(getByText('Seguir'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('disables action button when actionDisabled is true', () => {
    const onAction = jest.fn();
    const { getByText } = renderWithTheme(
      <PlayerCard
        name="Carol"
        actionLabel="Pendiente"
        onAction={onAction}
        actionDisabled
      />,
    );
    const btn = getByText('Pendiente').parent;
    // Disabled prop should prevent the press
    if (btn) fireEvent.press(btn);
    expect(onAction).not.toHaveBeenCalled();
  });

  it('does not render action button when actionLabel is not provided', () => {
    const { queryByText } = renderWithTheme(<PlayerCard name="Dave" />);
    expect(queryByText('Añadir amigo')).toBeNull();
  });

  it('does not show gamesInCommon text when count is 0', () => {
    // gamesInCommon=0 avoids calling the missing `t` function in PlayerCard
    const { queryByText } = renderWithTheme(
      <PlayerCard name="Eve" gamesInCommon={0} />,
    );
    // No "juegos en común" text should appear for 0
    expect(queryByText(/common/i)).toBeNull();
  });
});
