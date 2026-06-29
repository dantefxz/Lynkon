import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { SearchBar } from '@/components/SearchBar';
import { renderWithTheme } from '../setup/testUtils';

describe('SearchBar (direct)', () => {
  it('renders with the given placeholder', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <SearchBar value="" onChangeText={jest.fn()} placeholder="Buscar juegos..." />,
    );
    expect(getByPlaceholderText('Buscar juegos...')).toBeTruthy();
  });

  it('uses "Buscar..." as default placeholder', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <SearchBar value="" onChangeText={jest.fn()} />,
    );
    expect(getByPlaceholderText('Buscar...')).toBeTruthy();
  });

  it('displays the current value', () => {
    const { getByDisplayValue } = renderWithTheme(
      <SearchBar value="halo" onChangeText={jest.fn()} />,
    );
    expect(getByDisplayValue('halo')).toBeTruthy();
  });

  it('calls onChangeText when user types', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = renderWithTheme(
      <SearchBar value="" onChangeText={onChangeText} placeholder="Buscar..." />,
    );
    fireEvent.changeText(getByPlaceholderText('Buscar...'), 'test');
    expect(onChangeText).toHaveBeenCalledWith('test');
  });

  it('shows clear button when value is not empty', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(
      <SearchBar value="something" onChangeText={jest.fn()} />,
    );
    const { TouchableOpacity } = require('react-native');
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onChangeText("") and onClear when clear button is pressed', () => {
    const onChangeText = jest.fn();
    const onClear = jest.fn();
    const { UNSAFE_getAllByType } = renderWithTheme(
      <SearchBar value="something" onChangeText={onChangeText} onClear={onClear} />,
    );
    const { TouchableOpacity } = require('react-native');
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[buttons.length - 1]);
    expect(onChangeText).toHaveBeenCalledWith('');
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('search icon is not wrapped in a button when onSearch is not provided', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(
      <SearchBar value="" onChangeText={jest.fn()} />,
    );
    const { TouchableOpacity } = require('react-native');
    // No TouchableOpacity when no onSearch and value is empty
    expect(() => UNSAFE_getAllByType(TouchableOpacity)).toThrow();
  });

  it('shows search as a TouchableOpacity when onSearch is provided', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(
      <SearchBar value="" onChangeText={jest.fn()} onSearch={jest.fn()} />,
    );
    const { TouchableOpacity } = require('react-native');
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onSearch when search button pressed with value >= 2 chars', () => {
    const onSearch = jest.fn();
    const { UNSAFE_getAllByType } = renderWithTheme(
      <SearchBar value="ab" onChangeText={jest.fn()} onSearch={onSearch} />,
    );
    const { TouchableOpacity } = require('react-native');
    const [searchBtn] = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(searchBtn);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('search button is disabled when value < 2 chars', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(
      <SearchBar value="a" onChangeText={jest.fn()} onSearch={jest.fn()} />,
    );
    const { TouchableOpacity } = require('react-native');
    const [searchBtn] = UNSAFE_getAllByType(TouchableOpacity);
    expect(searchBtn.props.disabled).toBe(true);
  });
});
