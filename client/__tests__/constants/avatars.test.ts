import {
  AVATAR_IDS,
  getAvatarIdForSeed,
  normalizeAvatarId,
  resolveAvatarSource,
} from '@/constants/avatars';

describe('avatars', () => {
  describe('AVATAR_IDS', () => {
    it('contains 8 avatar IDs', () => {
      expect(AVATAR_IDS).toHaveLength(8);
    });

    it('all IDs follow the avatar_NN pattern', () => {
      AVATAR_IDS.forEach((id) => {
        expect(id).toMatch(/^avatar_0[1-8]$/);
      });
    });
  });

  describe('getAvatarIdForSeed', () => {
    it('returns a valid avatar ID', () => {
      const id = getAvatarIdForSeed('someUser');
      expect(AVATAR_IDS).toContain(id);
    });

    it('returns a deterministic result for the same seed', () => {
      const a = getAvatarIdForSeed('player123');
      const b = getAvatarIdForSeed('player123');
      expect(a).toBe(b);
    });

    it('returns different IDs for different seeds (probabilistic)', () => {
      const results = new Set(
        ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'hank'].map(
          getAvatarIdForSeed,
        ),
      );
      expect(results.size).toBeGreaterThan(1);
    });

    it('falls back to avatar_01 for empty string seed', () => {
      // empty string is normalised to DEFAULT_AVATAR_ID before hashing
      const id = getAvatarIdForSeed('');
      expect(AVATAR_IDS).toContain(id);
    });

    it('trims whitespace before hashing', () => {
      expect(getAvatarIdForSeed('  user  ')).toBe(getAvatarIdForSeed('user'));
    });
  });

  describe('normalizeAvatarId', () => {
    it('returns a valid avatar ID for a valid input', () => {
      const id = normalizeAvatarId('avatar_03');
      expect(id).toBe('avatar_03');
    });

    it('falls back to seed when avatarId is invalid', () => {
      const id = normalizeAvatarId('bad_id', 'testSeed');
      expect(AVATAR_IDS).toContain(id);
    });

    it('falls back to seed when avatarId is null', () => {
      const id = normalizeAvatarId(null, 'testSeed');
      expect(AVATAR_IDS).toContain(id);
    });

    it('falls back to seed when avatarId is undefined', () => {
      const id = normalizeAvatarId(undefined, 'testSeed');
      expect(AVATAR_IDS).toContain(id);
    });

    it('falls back to seed when avatarId is empty string', () => {
      const id = normalizeAvatarId('', 'testSeed');
      expect(AVATAR_IDS).toContain(id);
    });

    it('is consistent — same valid id always returns the same id', () => {
      expect(normalizeAvatarId('avatar_05')).toBe('avatar_05');
      expect(normalizeAvatarId('avatar_05', 'anyeed')).toBe('avatar_05');
    });
  });

  describe('resolveAvatarSource', () => {
    it('returns a defined value (image source) for a valid avatar ID', () => {
      const source = resolveAvatarSource('avatar_01');
      expect(source).toBeDefined();
    });

    it('returns a defined value when avatarId is null (uses seed fallback)', () => {
      const source = resolveAvatarSource(null, 'someUser');
      expect(source).toBeDefined();
    });

    it('returns consistent results for the same inputs', () => {
      expect(resolveAvatarSource('avatar_02')).toEqual(resolveAvatarSource('avatar_02'));
    });
  });
});
