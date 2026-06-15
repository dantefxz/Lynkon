import AsyncStorage from '@react-native-async-storage/async-storage';

export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export type SkillLevel = typeof SKILL_LEVELS[number];

const KEY = (gameId: string) => `skill_level_${gameId}`;

export const SKILL_COLORS: Record<SkillLevel, string> = {
  beginner:     '#22C55E',
  intermediate: '#60A5FA',
  advanced:     '#F59E0B',
  expert:       '#A855F7',
};

export async function getSkillLevel(gameId: string): Promise<SkillLevel | null> {
  const val = await AsyncStorage.getItem(KEY(gameId));
  return (SKILL_LEVELS as readonly string[]).includes(val ?? '') ? (val as SkillLevel) : null;
}

export async function setSkillLevel(gameId: string, level: SkillLevel | null): Promise<void> {
  if (level === null) {
    await AsyncStorage.removeItem(KEY(gameId));
  } else {
    await AsyncStorage.setItem(KEY(gameId), level);
  }
}

export async function getAllSkillLevels(): Promise<Record<string, SkillLevel>> {
  const keys = await AsyncStorage.getAllKeys();
  const skillKeys = keys.filter((k) => k.startsWith('skill_level_'));
  if (skillKeys.length === 0) return {};
  const pairs = await AsyncStorage.multiGet(skillKeys);
  const result: Record<string, SkillLevel> = {};
  for (const [key, val] of pairs) {
    if (val && (SKILL_LEVELS as readonly string[]).includes(val)) {
      result[key.replace('skill_level_', '')] = val as SkillLevel;
    }
  }
  return result;
}
