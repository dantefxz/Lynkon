import { normalizePlatformId, PLATFORM_ORDER, PLATFORM_LABELS } from '@/constants/platforms';

describe('platforms', () => {
  describe('PLATFORM_ORDER', () => {
    it('defines the three main platforms', () => {
      expect(PLATFORM_ORDER).toEqual(['steam', 'playstation', 'xbox']);
    });
  });

  describe('PLATFORM_LABELS', () => {
    it('has a label for each platform', () => {
      expect(PLATFORM_LABELS.steam).toBe('Steam');
      expect(PLATFORM_LABELS.playstation).toBe('PlayStation');
      expect(PLATFORM_LABELS.xbox).toBe('Xbox');
    });
  });

  describe('normalizePlatformId', () => {
    it('returns null for empty string', () => {
      expect(normalizePlatformId('')).toBeNull();
    });

    it('returns null for unrecognised platform', () => {
      expect(normalizePlatformId('nintendo')).toBeNull();
      expect(normalizePlatformId('PC')).toBeNull();
      expect(normalizePlatformId('epic games')).toBeNull();
    });

    describe('Steam', () => {
      it('recognises "steam"', () => {
        expect(normalizePlatformId('steam')).toBe('steam');
      });

      it('is case-insensitive', () => {
        expect(normalizePlatformId('Steam')).toBe('steam');
        expect(normalizePlatformId('STEAM')).toBe('steam');
      });

      it('matches partial strings containing "steam"', () => {
        expect(normalizePlatformId('steamworks')).toBe('steam');
        expect(normalizePlatformId('My Steam Account')).toBe('steam');
      });
    });

    describe('PlayStation / PSN', () => {
      it('recognises "psn"', () => {
        expect(normalizePlatformId('psn')).toBe('psn');
        expect(normalizePlatformId('PSN')).toBe('psn');
      });

      it('recognises "playstation"', () => {
        expect(normalizePlatformId('playstation')).toBe('psn');
        expect(normalizePlatformId('PlayStation')).toBe('psn');
        expect(normalizePlatformId('PlayStation 5')).toBe('psn');
      });

      it('recognises strings containing "ps"', () => {
        expect(normalizePlatformId('ps4')).toBe('psn');
        expect(normalizePlatformId('ps5')).toBe('psn');
      });
    });

    describe('Xbox', () => {
      it('recognises "xbox"', () => {
        expect(normalizePlatformId('xbox')).toBe('xbox');
        expect(normalizePlatformId('Xbox')).toBe('xbox');
        expect(normalizePlatformId('Xbox Series X')).toBe('xbox');
      });

      it('recognises "microsoft"', () => {
        expect(normalizePlatformId('microsoft')).toBe('xbox');
        expect(normalizePlatformId('Microsoft Store')).toBe('xbox');
      });
    });

    it('trims whitespace before matching', () => {
      expect(normalizePlatformId('  steam  ')).toBe('steam');
      expect(normalizePlatformId('  xbox  ')).toBe('xbox');
    });
  });
});
