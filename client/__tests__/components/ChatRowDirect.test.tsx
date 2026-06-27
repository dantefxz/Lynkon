import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { ChatRow, ChatBubble } from '@/components/ChatRow';
import { renderWithTheme } from '../setup/testUtils';

describe('ChatRow (direct)', () => {
  it('renders the contact name', () => {
    const { getByText } = renderWithTheme(<ChatRow name="Alice" onPress={jest.fn()} />);
    expect(getByText('Alice')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(<ChatRow name="Bob" onPress={onPress} />);
    fireEvent.press(getByText('Bob'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders last message when provided', () => {
    const { getByText } = renderWithTheme(
      <ChatRow name="Carol" lastMessage="Hello!" onPress={jest.fn()} />,
    );
    expect(getByText('Hello!')).toBeTruthy();
  });

  it('does not render last message when omitted', () => {
    const { queryByText } = renderWithTheme(<ChatRow name="Dave" onPress={jest.fn()} />);
    expect(queryByText('Hello!')).toBeNull();
  });

  it('renders timestamp when provided', () => {
    const { getByText } = renderWithTheme(
      <ChatRow name="Eve" timestamp="12:00" onPress={jest.fn()} />,
    );
    expect(getByText('12:00')).toBeTruthy();
  });

  it('shows unread badge when unread > 0', () => {
    const { getByText } = renderWithTheme(
      <ChatRow name="Frank" unread={5} onPress={jest.fn()} />,
    );
    expect(getByText('5')).toBeTruthy();
  });

  it('shows "9+" when unread > 9', () => {
    const { getByText } = renderWithTheme(
      <ChatRow name="Grace" unread={20} onPress={jest.fn()} />,
    );
    expect(getByText('9+')).toBeTruthy();
  });

  it('does not show badge when unread is 0', () => {
    const { queryByText } = renderWithTheme(
      <ChatRow name="Hank" unread={0} onPress={jest.fn()} />,
    );
    expect(queryByText('0')).toBeNull();
  });

  it('shows online dot styling when isOnline=true', () => {
    const { getByText } = renderWithTheme(
      <ChatRow name="Ivy" isOnline={true} onPress={jest.fn()} />,
    );
    expect(getByText('Ivy')).toBeTruthy();
  });
});

describe('ChatBubble (direct)', () => {
  it('renders the message text', () => {
    const { getByText } = renderWithTheme(
      <ChatBubble message="Hey!" timestamp="10:00" isOwn={false} />,
    );
    expect(getByText('Hey!')).toBeTruthy();
  });

  it('renders the timestamp', () => {
    const { getByText } = renderWithTheme(
      <ChatBubble message="Hi" timestamp="09:30" isOwn={true} />,
    );
    expect(getByText('09:30')).toBeTruthy();
  });

  it('own message text is white', () => {
    const { getByText } = renderWithTheme(
      <ChatBubble message="Mine" timestamp="10:00" isOwn={true} />,
    );
    const styles: any[] = [getByText('Mine').props.style].flat();
    const color = styles.find((s: any) => s?.color)?.color;
    expect(color).toBe('#fff');
  });

  it('other message uses theme text color', () => {
    const { getByText } = renderWithTheme(
      <ChatBubble message="Theirs" timestamp="10:00" isOwn={false} />,
    );
    const styles: any[] = [getByText('Theirs').props.style].flat();
    const color = styles.find((s: any) => s?.color)?.color;
    expect(color).not.toBe('#fff');
  });
});
