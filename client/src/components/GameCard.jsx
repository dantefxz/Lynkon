// src/components/GameCard.jsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../theme/colors';
import { wp, ms, fs, screen } from '../theme/responsive';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - screen.padding * 3) / 2;

export function GameCard({ game, onPress, onToggleFavorite, style }) {
  const progress = game.totalAchievements > 0
    ? Math.round((game.completedAchievements / game.totalAchievements) * 100)
    : 0;
  const platform = game.platforms?.[0]?.name;

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.coverContainer}>
        <Image source={{ uri: game.cover }} style={styles.cover} resizeMode="cover" />
        {platform && (
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{platform.toUpperCase()}</Text>
          </View>
        )}
        {progress === 100 && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>★</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{game.name}</Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Progreso</Text>
          <Text style={styles.progressPct}>{progress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.hours}>{game.totalHours}h jugadas</Text>
      </View>

      {onToggleFavorite && (
        <TouchableOpacity
          style={[styles.favBtn, game.isFavorite && styles.favBtnActive]}
          onPress={() => onToggleFavorite(game.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.favIcon}>{game.isFavorite ? '★' : '☆'}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: ms(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: ms(12),
  },
  coverContainer: { position: 'relative', aspectRatio: 2 / 3 },
  cover:          { width: '100%', height: '100%' },
  platformBadge: {
    position: 'absolute', top: wp(8), left: wp(8),
    backgroundColor: colors.purple, borderRadius: ms(6),
    paddingHorizontal: wp(6), paddingVertical: ms(3),
  },
  platformText:   { color: '#fff', fontSize: fs(9), fontWeight: '700' },
  completedBadge: {
    position: 'absolute', top: wp(8), right: wp(8),
    backgroundColor: '#EAB308', borderRadius: ms(6), padding: ms(4),
  },
  completedText:  { color: '#000', fontSize: fs(12) },
  info:           { padding: ms(10) },
  name:           { color: colors.text, fontSize: fs(13), fontWeight: '600', marginBottom: ms(6) },
  progressRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: ms(4) },
  progressLabel:  { color: colors.textSecondary, fontSize: fs(10) },
  progressPct:    { color: colors.purpleLight, fontSize: fs(10), fontWeight: '600' },
  progressBar:    { height: ms(4), backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: ms(6), overflow: 'hidden' },
  progressFill:   { height: '100%', backgroundColor: colors.purple, borderRadius: 2 },
  hours:          { color: colors.textMuted, fontSize: fs(10) },
  favBtn: {
    position: 'absolute', top: wp(8), right: wp(8),
    width: ms(30), height: ms(30), borderRadius: ms(8),
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  favBtnActive:   { backgroundColor: colors.purple },
  favIcon:        { color: '#fff', fontSize: fs(14) },
});
