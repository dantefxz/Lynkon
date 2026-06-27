import { rw, rh, rf, gridColumns, cardWidth, SCREEN_WIDTH, SCREEN_HEIGHT } from '@/utils/responsive';

describe('responsive utilities', () => {
  describe('rw (responsive width)', () => {
    it('returns a number', () => {
      expect(typeof rw(16)).toBe('number');
    });

    it('returns 0 for input 0', () => {
      expect(rw(0)).toBe(0);
    });

    it('scales proportionally — larger input produces larger output', () => {
      expect(rw(20)).toBeGreaterThan(rw(10));
    });

    it('returns a positive number for positive input', () => {
      expect(rw(16)).toBeGreaterThan(0);
    });

    it('rw(390) equals SCREEN_WIDTH (base width maps 1:1)', () => {
      expect(rw(390)).toBeCloseTo(SCREEN_WIDTH, 0);
    });
  });

  describe('rh (responsive height)', () => {
    it('returns a number', () => {
      expect(typeof rh(16)).toBe('number');
    });

    it('returns 0 for input 0', () => {
      expect(rh(0)).toBe(0);
    });

    it('scales proportionally', () => {
      expect(rh(20)).toBeGreaterThan(rh(10));
    });

    it('rh(844) equals SCREEN_HEIGHT (base height maps 1:1)', () => {
      expect(rh(844)).toBeCloseTo(SCREEN_HEIGHT, 0);
    });
  });

  describe('rf (responsive font)', () => {
    it('returns a number', () => {
      expect(typeof rf(16)).toBe('number');
    });

    it('returns 0 for input 0', () => {
      expect(rf(0)).toBe(0);
    });

    it('caps at 1.3× the original size', () => {
      // On a large screen rf might scale up, but never beyond 1.3x
      const size = 14;
      expect(rf(size)).toBeLessThanOrEqual(size * 1.3 + 0.5); // +0.5 rounding tolerance
    });

    it('scales proportionally for typical sizes', () => {
      expect(rf(20)).toBeGreaterThan(rf(10));
    });
  });

  describe('gridColumns', () => {
    it('returns a valid column count (2, 3, or 4)', () => {
      expect([2, 3, 4]).toContain(gridColumns());
    });

    it('respects the screen-width thresholds', () => {
      if (SCREEN_WIDTH >= 768) expect(gridColumns()).toBe(4);
      else if (SCREEN_WIDTH >= 500) expect(gridColumns()).toBe(3);
      else expect(gridColumns()).toBe(2);
    });

    it('returns 4 for screens >= 768px', () => {
      let fn!: () => number;
      jest.isolateModules(() => {
        jest.doMock('react-native', () => ({
          Dimensions: { get: () => ({ width: 800, height: 1024 }) },
          PixelRatio: { roundToNearestPixel: (n: number) => Math.round(n) },
        }));
        fn = require('@/utils/responsive').gridColumns;
      });
      expect(fn()).toBe(4);
    });

    it('returns 2 for screens < 500px', () => {
      let fn!: () => number;
      jest.isolateModules(() => {
        jest.doMock('react-native', () => ({
          Dimensions: { get: () => ({ width: 375, height: 812 }) },
          PixelRatio: { roundToNearestPixel: (n: number) => Math.round(n) },
        }));
        fn = require('@/utils/responsive').gridColumns;
      });
      expect(fn()).toBe(2);
    });
  });

  describe('cardWidth', () => {
    it('returns a positive number', () => {
      expect(cardWidth(2)).toBeGreaterThan(0);
    });

    it('returns a smaller card width for more columns', () => {
      expect(cardWidth(3)).toBeLessThan(cardWidth(2));
    });

    it('fills the screen width when accounting for padding and gaps', () => {
      const cols = 2;
      // 2 cards should roughly fill the available space
      const total = cardWidth(cols) * cols;
      expect(total).toBeLessThan(SCREEN_WIDTH);
      expect(total).toBeGreaterThan(SCREEN_WIDTH * 0.7);
    });
  });
});
