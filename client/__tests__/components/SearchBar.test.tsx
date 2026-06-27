import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { SearchBar } from '@/components';
import { renderWithTheme } from '../setup/testUtils';

describe('SearchBar', () => {
  it('renders with the given placeholder', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <SearchBar value="" onChangeText={jest.fn()} placeholder="Buscar usuarios..." />,
    );
    expect(getByPlaceholderText('Buscar usuarios...')).toBeTruthy();
  });

  it('uses "Search..." as default placeholder', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <SearchBar value="" onChangeText={jest.fn()} />,
    );
    expect(getByPlaceholderText('Search...')).toBeTruthy();
  });

  it('displays the current value', () => {
    const { getByDisplayValue } = renderWithTheme(
      <SearchBar value="fortnite" onChangeText={jest.fn()} />,
    );
    expect(getByDisplayValue('fortnite')).toBeTruthy();
  });

  it('calls onChangeText when the user types', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = renderWithTheme(
      <SearchBar value="" onChangeText={onChangeText} placeholder="Search..." />,
    );
    fireEvent.changeText(getByPlaceholderText('Search...'), 'halo');
    expect(onChangeText).toHaveBeenCalledWith('halo');
  });

  it('calls onChangeText with an empty string on clear', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = renderWithTheme(
      <SearchBar value="something" onChangeText={onChangeText} />,
    );
    fireEvent.changeText(getByDisplayValue('something'), '');
    expect(onChangeText).toHaveBeenCalledWith('');
  });
});
