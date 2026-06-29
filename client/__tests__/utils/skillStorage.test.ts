import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSkillLevel,
  setSkillLevel,
  getAllSkillLevels,
  SKILL_LEVELS,
  SKILL_COLORS,
} from '@/utils/skillStorage';

describe('skillStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('SKILL_LEVELS constant', () => {
    it('contains all four skill levels in order', () => {
      expect(SKILL_LEVELS).toEqual(['beginner', 'intermediate', 'advanced', 'expert']);
    });
  });

  describe('SKILL_COLORS constant', () => {
    it('has a color for each skill level', () => {
      SKILL_LEVELS.forEach((level) => {
        expect(SKILL_COLORS[level]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('getSkillLevel', () => {
    it('returns null when no value is stored', async () => {
      const result = await getSkillLevel('game123');
      expect(result).toBeNull();
    });

    it('returns stored beginner level', async () => {
      await AsyncStorage.setItem('skill_level_game123', 'beginner');
      expect(await getSkillLevel('game123')).toBe('beginner');
    });

    it('returns stored intermediate level', async () => {
      await AsyncStorage.setItem('skill_level_abc', 'intermediate');
      expect(await getSkillLevel('abc')).toBe('intermediate');
    });

    it('returns stored advanced level', async () => {
      await AsyncStorage.setItem('skill_level_g1', 'advanced');
      expect(await getSkillLevel('g1')).toBe('advanced');
    });

    it('returns stored expert level', async () => {
      await AsyncStorage.setItem('skill_level_g2', 'expert');
      expect(await getSkillLevel('g2')).toBe('expert');
    });

    it('returns null for an invalid stored value', async () => {
      await AsyncStorage.setItem('skill_level_game123', 'grandmaster');
      expect(await getSkillLevel('game123')).toBeNull();
    });

    it('uses the gameId as part of the storage key', async () => {
      await setSkillLevel('gameA', 'advanced');
      await setSkillLevel('gameB', 'expert');
      expect(await getSkillLevel('gameA')).toBe('advanced');
      expect(await getSkillLevel('gameB')).toBe('expert');
    });
  });

  describe('setSkillLevel', () => {
    it('persists a skill level', async () => {
      await setSkillLevel('game1', 'intermediate');
      const raw = await AsyncStorage.getItem('skill_level_game1');
      expect(raw).toBe('intermediate');
    });

    it('removes the key when called with null', async () => {
      await AsyncStorage.setItem('skill_level_game1', 'advanced');
      await setSkillLevel('game1', null);
      const raw = await AsyncStorage.getItem('skill_level_game1');
      expect(raw).toBeNull();
    });

    it('overwrites an existing level', async () => {
      await setSkillLevel('game1', 'beginner');
      await setSkillLevel('game1', 'expert');
      expect(await getSkillLevel('game1')).toBe('expert');
    });
  });

  describe('getAllSkillLevels', () => {
    it('returns an empty object when nothing is stored', async () => {
      expect(await getAllSkillLevels()).toEqual({});
    });

    it('returns all stored skill levels keyed by gameId', async () => {
      await setSkillLevel('g1', 'beginner');
      await setSkillLevel('g2', 'expert');
      const result = await getAllSkillLevels();
      expect(result).toEqual({ g1: 'beginner', g2: 'expert' });
    });

    it('ignores non-skill keys in AsyncStorage', async () => {
      await AsyncStorage.setItem('authToken', 'tok123');
      await AsyncStorage.setItem('app_theme', 'dark');
      await setSkillLevel('g1', 'advanced');
      const result = await getAllSkillLevels();
      expect(result).toEqual({ g1: 'advanced' });
    });

    it('ignores invalid skill values stored under skill_level_ keys', async () => {
      await AsyncStorage.setItem('skill_level_g1', 'godlike');
      const result = await getAllSkillLevels();
      expect(result).toEqual({});
    });
  });
});
