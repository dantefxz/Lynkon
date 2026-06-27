import { colors } from '@/theme/colors';

describe('theme/colors', () => {
  it('exports a colors object', () => {
    expect(typeof colors).toBe('object');
    expect(colors).not.toBeNull();
  });

  it('has a background color', () => {
    expect(colors.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('has a purple brand color', () => {
    expect(colors.purple).toBe('#A855F7');
  });

  it('has error, warning and online status colors', () => {
    expect(colors.error).toBe('#EF4444');
    expect(colors.warning).toBe('#F59E0B');
    expect(colors.online).toBe('#22C55E');
  });

  it('has text and textMuted colors', () => {
    expect(colors.text).toBe('#FFFFFF');
    expect(colors.textMuted).toBe('#8888AA');
  });

  it('exports all expected keys', () => {
    const expectedKeys = [
      'background', 'card', 'cardAlt', 'cardBorder', 'border',
      'text', 'textMuted', 'purple', 'purpleLight', 'purpleMuted',
      'purpleDim', 'purpleBorder', 'warning', 'error', 'online',
    ];
    expectedKeys.forEach((key) => {
      expect(colors).toHaveProperty(key);
    });
  });
});
