import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
import { rw, rh, rf } from '@/utils/responsive';
import { PLATFORM_LABELS, PLATFORM_LOGOS, normalizePlatformId } from '@/constants/platforms';
import { getProfileAvatar } from '@/services/mockData';
import { resolveAvatarSource } from '@/constants/avatars';

export interface ProfileStat {
  icon: string;
  iconColor: string;
  value: number | string;
  label: string;
}

export interface ProfileHeaderProps {
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
  stats: ProfileStat[];
  platforms?: string[];
  onSync?: () => void;
  syncing?: boolean;
  onEditBio?: () => void;
}

export function ProfileHeader({ name, email, avatar, bio, stats, platforms = [], onSync, syncing, onEditBio }: ProfileHeaderProps) {
  const { colors } = useTheme();
  const avatarSize = rw(72);
  const avatarSource = resolveAvatarSource(avatar || getProfileAvatar(name), name);

  return (
    <View style={[styles.container, { backgroundColor: colors.cardAlt }]}>
      <View style={styles.userRow}>
        <View style={[
          styles.avatarRing,
          {
            width: avatarSize + rw(6),
            height: avatarSize + rw(6),
            borderRadius: (avatarSize + rw(6)) / 2,
            borderColor: colors.purple,
            shadowColor: colors.purple,
          },
        ]}>
          <Image source={avatarSource} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }} />
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text, flexShrink: 1 }]} numberOfLines={1}>{name}</Text>
            {onEditBio && (
              <TouchableOpacity onPress={onEditBio} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="edit" size={rw(14)} color={colors.purple} />
              </TouchableOpacity>
            )}
          </View>
          {email ? <Text style={[styles.email, { color: colors.textMuted }]} numberOfLines={1}>{email}</Text> : null}
          {(bio || onEditBio) ? (
            <TouchableOpacity
              onPress={onEditBio}
              disabled={!onEditBio}
              activeOpacity={onEditBio ? 0.7 : 1}
              style={styles.bioRow}
            >
              <Text style={[styles.bio, { color: colors.textMuted, opacity: bio ? 1 : 0.5 }]} numberOfLines={2}>
                {bio || 'Añadir descripción...'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {onSync && (
          <TouchableOpacity
            style={styles.syncBtn}
            onPress={onSync}
            disabled={syncing}
          >
            {syncing
              ? <ActivityIndicator size="small" color={colors.purple} />
              : <MaterialIcons name="sync" size={rw(22)} color={colors.purple} />}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialIcons name={s.icon as any} size={rw(19)} color={s.iconColor} />
            <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {platforms.length > 0 && (
        <View style={styles.platformsRow}>
          {platforms.map((p) => {
            const platformId = normalizePlatformId(p);
            if (!platformId) return null;
            return (
              <View key={p} style={[styles.platformBadge, { backgroundColor: colors.purpleMuted, borderColor: colors.purpleBorder }]}>
                <Image source={PLATFORM_LOGOS[platformId]} style={styles.platformLogo} resizeMode="contain" />
                <Text style={[styles.platformName, { color: colors.textSecondary }]}>{PLATFORM_LABELS[platformId]}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: rw(18), paddingBottom: rh(20), gap: rh(16) },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: rw(14) },
  avatarRing: {
    borderWidth: rw(3),
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55, shadowRadius: 10, elevation: 8,
  },
  userInfo:       { flex: 1, gap: rh(3), flexShrink: 1 },
  nameRow:        { flexDirection: 'row', alignItems: 'center', gap: rw(6) },
  bioRow:         { flexShrink: 1 },
  bio:            { fontSize: rf(12), lineHeight: rh(16), flexShrink: 1 },
  syncBtn:        { padding: rw(8) },
  name: { fontSize: rf(21), fontWeight: '700', flexShrink: 1 },
  email: { fontSize: rf(13) },
  statsRow: { flexDirection: 'row', gap: rw(10) },
  statCard: {
    flex: 1, alignItems: 'center', paddingVertical: rh(12),
    paddingHorizontal: rw(8), borderRadius: rw(12), borderWidth: 1, gap: rh(3),
  },
  statValue: { fontSize: rf(19), fontWeight: '700' },
  statLabel: { fontSize: rf(11) },
  platformsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rw(8) },
  platformBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rw(6),
    paddingHorizontal: rw(10), paddingVertical: rh(5),
    borderRadius: rw(20), borderWidth: 1,
  },
  platformLogo: { width: rw(14), height: rw(14) },
  platformName: { fontSize: rf(12), fontWeight: '500' },
});
