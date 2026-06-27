import React from 'react';
import { ChatBubble } from '@/components';
import { renderWithTheme } from '../setup/testUtils';

describe('ChatBubble', () => {
  it('renders the message text', () => {
    const { getByText } = renderWithTheme(
      <ChatBubble message="Hola!" isOwn={false} />,
    );
    expect(getByText('Hola!')).toBeTruthy();
  });

  it('renders the timestamp when provided', () => {
    const { getByText } = renderWithTheme(
      <ChatBubble message="Hey" isOwn={false} timestamp="10:30" />,
    );
    expect(getByText('10:30')).toBeTruthy();
  });

  it('does not render timestamp when not provided', () => {
    const { queryByText } = renderWithTheme(
      <ChatBubble message="Hey" isOwn={false} />,
    );
    expect(queryByText('10:30')).toBeNull();
  });

  it('own bubble uses purple background', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(
      <ChatBubble message="My message" isOwn={true} />,
    );
    const { View } = require('react-native');
    const views = UNSAFE_getAllByType(View);
    const bubble = views.find((v: any) => {
      const styles: any[] = [v.props.style].flat();
      return styles.some((s: any) => s?.backgroundColor === '#7C3AED');
    });
    expect(bubble).toBeDefined();
  });

  it('other bubble uses card background (not purple)', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(
      <ChatBubble message="Their message" isOwn={false} />,
    );
    const { View } = require('react-native');
    const views = UNSAFE_getAllByType(View);
    const purpleBubble = views.find((v: any) => {
      const styles: any[] = [v.props.style].flat();
      return styles.some((s: any) => s?.backgroundColor === '#7C3AED');
    });
    expect(purpleBubble).toBeUndefined();
  });

  it('own message text is white', () => {
    const { getByText } = renderWithTheme(
      <ChatBubble message="My message" isOwn={true} />,
    );
    const textEl = getByText('My message');
    const styles: any[] = [textEl.props.style].flat();
    const color = styles.find((s: any) => s?.color)?.color;
    expect(color).toBe('#fff');
  });
});
