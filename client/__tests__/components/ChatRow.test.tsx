import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { ChatRow } from '@/components';
import { renderWithTheme } from '../setup/testUtils';

describe('ChatRow', () => {
  it('renders the contact name', () => {
    const { getByText } = renderWithTheme(<ChatRow name="Alice" />);
    expect(getByText('Alice')).toBeTruthy();
  });

  it('renders the last message when provided', () => {
    const { getByText } = renderWithTheme(
      <ChatRow name="Bob" lastMessage="Hey, are you online?" />,
    );
    expect(getByText('Hey, are you online?')).toBeTruthy();
  });

  it('does not render last message when not provided', () => {
    const { queryByText } = renderWithTheme(<ChatRow name="Bob" />);
    expect(queryByText('Hey, are you online?')).toBeNull();
  });

  it('renders the timestamp when provided', () => {
    const { getByText } = renderWithTheme(
      <ChatRow name="Carol" timestamp="14:30" />,
    );
    expect(getByText('14:30')).toBeTruthy();
  });

  it('calls onPress when the row is tapped', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(
      <ChatRow name="Dave" onPress={onPress} />,
    );
    fireEvent.press(getByText('Dave'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows unread badge with count when unreadCount > 0', () => {
    const { getByText } = renderWithTheme(
      <ChatRow name="Eve" unreadCount={3} />,
    );
    expect(getByText('3')).toBeTruthy();
  });

  it('shows "+99" badge when unreadCount > 99', () => {
    const { getByText } = renderWithTheme(
      <ChatRow name="Frank" unreadCount={150} />,
    );
    expect(getByText('+99')).toBeTruthy();
  });

  it('does not show badge when unreadCount is 0', () => {
    const { queryByText } = renderWithTheme(
      <ChatRow name="Grace" unreadCount={0} />,
    );
    expect(queryByText('0')).toBeNull();
  });

  it('renders remove button when onRemove is provided', () => {
    const onRemove = jest.fn();
    const { UNSAFE_getAllByType } = renderWithTheme(
      <ChatRow name="Hank" onRemove={onRemove} />,
    );
    const { TouchableOpacity } = require('react-native');
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    // There are two: the row itself and the remove button
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    // The last button is the remove button
    fireEvent.press(buttons[buttons.length - 1]);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('does not render remove button when onRemove is not provided', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(<ChatRow name="Ivy" />);
    const { TouchableOpacity } = require('react-native');
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    // Only the main row TouchableOpacity
    expect(buttons).toHaveLength(1);
  });
});
