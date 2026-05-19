/**
 * GameCard
 * --------
 * Card de juego con portada, badge de rank, barra de progreso de logros y horas.
 * Usado en: profile (grid y favoritos), platform detail.
 */
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors } from '@/theme/colors';
import { rw, rh, rf } from '@/utils/responsive';

export interface GameCardProps {
  id: string;
  name: string;
  cover: string;
  rank: number;
  totalHours: number;
  totalAchievements: number;
  completedAchievements: number;
  isFavorite?: boolean;
  width: number;
  onPress: () => void;
}

export function GameCard({
  name, cover, rank, totalHours,
  totalAchievements, completedAchievements,
  width, onPress,
}: GameCardProps) {
  const pct = totalAchievements > 0
    ? Math.round((completedAchievements / totalAchievements) * 100)
    : 0;
  const isComplete = pct === 100;

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

      <View style={[styles.rankBadge, { backgroundColor: colors.purple }]}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>

      {isComplete && (
        <View style={styles.trophyBadge}>
          <MaterialIcons name="emoji-events" size={rw(13)} color="#000" />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <View style={[styles.progressTrack, { backgroundColor: colors.purpleMuted }]}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.stats}>{pct}% · {totalHours}h</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: rw(12), borderWidth: 1, overflow: 'hidden' },
  cover: { width: '100%' },
  rankBadge: {
    position: 'absolute', top: rw(8), left: rw(8),
    paddingHorizontal: rw(8), paddingVertical: rh(3), borderRadius: rw(8),
  },
  rankText: { color: colors.text, fontSize: rf(11), fontWeight: '700' },
  trophyBadge: {
    position: 'absolute', top: rw(8), right: rw(8),
    backgroundColor: colors.warning, padding: rw(5), borderRadius: rw(7),
  },
  info: { padding: rw(10), gap: rh(5) },
  name: { color: colors.text, fontSize: rf(13), fontWeight: '600' },
  progressTrack: { height: rh(4), borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.purple, borderRadius: 2 },
  stats: { color: colors.textMuted, fontSize: rf(11) },
});
