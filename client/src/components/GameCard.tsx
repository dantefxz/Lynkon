import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors } from '@/theme/colors';
import { rw, rh, rf } from '@/utils/responsive';
import { PLATFORM_LOGOS, normalizePlatformId } from '@/constants/platforms';

export interface GameCardProps {
  id: string;
  name: string;
  cover: string;
  rank?: number;
  totalHours: number;
  totalAchievements: number;
  completedAchievements: number;
  platform?: string;
  isFavorite?: boolean;
  width: number;
  onPress: () => void;
  onRemove?: () => void;
}

export function GameCard({
  name, cover, totalHours, platform,
  totalAchievements, completedAchievements,
  width, onPress, onRemove,
}: GameCardProps) {
  const pct = totalAchievements > 0
    ? Math.round((completedAchievements / totalAchievements) * 100)
    : 0;
  const isComplete  = pct === 100;
  const platformId  = platform ? normalizePlatformId(platform) : null;
  const platformLogo = platformId ? PLATFORM_LOGOS[platformId] : null;

  return (
    <TouchableOpacity
      style={[styles.card, { width, backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: cover }}
        style={[styles.cover, { height: width * 1.15 }]}
        resizeMode="cover"
      />

      {isComplete && (
        <View style={styles.trophyBadge}>
          <MaterialIcons name="emoji-events" size={rw(13)} color="#000" />
        </View>
      )}

      {onRemove && (
        <TouchableOpacity
          style={styles.removeBadge}
          onPress={onRemove}
          hitSlop={{ top: 6, left: 6, bottom: 6, right: 6 }}
        >
          <MaterialIcons name="close" size={rw(12)} color="#fff" />
        </TouchableOpacity>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {totalAchievements > 0 && (
          <View style={[styles.progressTrack, { backgroundColor: colors.purpleMuted }]}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        )}
        <View style={styles.statsRow}>
          <Text style={styles.stats}>
            {totalAchievements > 0
              ? `${completedAchievements}/${totalAchievements} · ${pct}%`
              : `${totalHours}h jugadas`}
          </Text>
          {platformLogo && (
            <Image source={platformLogo} style={styles.platformLogo} resizeMode="contain" />
          )}
        </View>
        {totalAchievements > 0 && (
          <Text style={styles.hours}>{totalHours}h jugadas</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:          { borderRadius: rw(12), borderWidth: 1, overflow: 'hidden' },
  cover:         { width: '100%' },
  trophyBadge:   { position: 'absolute', top: rw(8), right: rw(8), backgroundColor: colors.warning, padding: rw(5), borderRadius: rw(7) },
  removeBadge:   { position: 'absolute', top: rw(8), left: rw(8), backgroundColor: 'rgba(0,0,0,0.65)', padding: rw(5), borderRadius: rw(7) },
  info:          { padding: rw(10), gap: rh(5) },
  name:          { color: colors.text, fontSize: rf(13), fontWeight: '600' },
  progressTrack: { height: rh(4), borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: colors.purple, borderRadius: 2 },
  statsRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stats:         { color: colors.textMuted, fontSize: rf(11) },
  hours:         { color: colors.textMuted, fontSize: rf(10) },
  platformLogo:  { width: rw(13), height: rw(13) },
});
