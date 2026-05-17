/**
 * ProfileHeader
 * -------------
 * Header de perfil con avatar (con ring), nombre, email,
 * stats (logros, juegos, favoritos) y badges de plataformas vinculadas.
 * Usado en: profile screen.
 */
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { rw, rh, rf } from '@/utils/responsive';
import { PLATFORM_LABELS, PLATFORM_LOGOS, normalizePlatformId } from '@/constants/platforms';

export interface ProfileStat {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: number | string;
  label: string;
}

export interface ProfileHeaderProps {
  name: string;
  email?: string;
  avatar?: string;
  stats: ProfileStat[];
  platforms?: string[];
}

export function ProfileHeader({ name, email, avatar, stats, platforms = [] }: ProfileHeaderProps) {
  const avatarSize = rw(72);

  return (
    <View style={[styles.container, { backgroundColor: colors.cardAlt }]}>
      {/* Fila usuario */}
      <View style={styles.userRow}>
        {/* Avatar con ring morado */}
        <View style={[
          styles.avatarRing,
          { width: avatarSize + rw(6), height: avatarSize + rw(6), borderRadius: (avatarSize + rw(6)) / 2 },
        ]}>
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
            />
          ) : (
            <View style={[styles.avatarFallback, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
              <Ionicons name="person" size={rw(34)} color={colors.purple} />
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {email ? <Text style={styles.email} numberOfLines={1}>{email}</Text> : null}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name={s.icon} size={rw(19)} color={s.iconColor} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Plataformas vinculadas */}
      {platforms.length > 0 && (
        <View style={styles.platformsRow}>
          {platforms.map((p) => {
            const platformId = normalizePlatformId(p);
            if (!platformId) return null;

            return (
              <View key={p} style={[styles.platformBadge, { backgroundColor: colors.purpleMuted, borderColor: colors.purpleBorder }]}> 
                <Image source={PLATFORM_LOGOS[platformId]} style={styles.platformLogo} resizeMode="contain" />
                <Text style={styles.platformName}>{PLATFORM_LABELS[platformId]}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: rw(18),
    paddingBottom: rh(20),
    gap: rh(16),
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(14),
  },
  avatarRing: {
    borderWidth: rw(3),
    borderColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarFallback: {
    backgroundColor: colors.purpleMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    gap: rh(3),
  },
  name: {
    color: colors.text,
    fontSize: rf(21),
    fontWeight: '700',
  },
  email: {
    color: colors.textMuted,
    fontSize: rf(13),
  },
  statsRow: {
    flexDirection: 'row',
    gap: rw(10),
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: rh(12),
    paddingHorizontal: rw(8),
    borderRadius: rw(12),
    borderWidth: 1,
    gap: rh(3),
  },
  statValue: {
    color: colors.text,
    fontSize: rf(19),
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: rf(11),
  },
  platformsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rw(8),
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(6),
    paddingHorizontal: rw(10),
    paddingVertical: rh(5),
    borderRadius: rw(20),
    borderWidth: 1,
  },
  platformLogo: {
    width: rw(14),
    height: rw(14),
  },
  platformName: {
    color: colors.textSecondary,
    fontSize: rf(12),
    fontWeight: '500',
  },
});
