// src/components/ProfileHeader.jsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { SettingsButton } from './SettingsButton';
import { wp, hp, ms, fs, isSmallScreen } from '../theme/responsive';

export function ProfileHeader({ user, stats, onSettingsPress, onAvatarPress, isOwnProfile = true }) {
  const avatarSize = isSmallScreen ? ms(58) : ms(72);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onAvatarPress} disabled={!isOwnProfile}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: user?.avatar }}
              style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
            />
            {isOwnProfile && (
              <View style={styles.editBadge}>
                <Text style={styles.editIcon}>✏️</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.nameBlock}>
          <Text style={styles.displayName} numberOfLines={1}>{user?.name || user?.username || 'Usuario'}</Text>
          <Text style={styles.username} numberOfLines={1}>@{user?.username || 'username'}</Text>
          {user?.bio ? <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text> : null}
        </View>

        {isOwnProfile && <SettingsButton onPress={onSettingsPress} />}
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <StatItem value={stats.totalGames      ?? 0} label="Juegos" />
          <View style={styles.divider} />
          <StatItem value={stats.totalHours      ?? 0} label="Horas" />
          <View style={styles.divider} />
          <StatItem value={stats.totalAchievements ?? 0} label="Logros" />
          <View style={styles.divider} />
          <StatItem value={stats.friends         ?? 0} label="Amigos" />
        </View>
      )}

      {user?.platforms?.length > 0 && (
        <View style={styles.platformsRow}>
          {user.platforms.map((p) => (
            <View key={p.platform} style={styles.platformChip}>
              <Text style={styles.platformText}>{p.platform.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function StatItem({ value, label }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card, borderRadius: ms(20),
    borderWidth: 1, borderColor: colors.border, padding: ms(16), gap: ms(16),
  },
  topRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: ms(14) },
  avatarWrapper:{ position: 'relative', flexShrink: 0 },
  avatar:       { borderWidth: 3, borderColor: colors.purple },
  editBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: colors.purple, borderRadius: ms(10),
    width: ms(22), height: ms(22), alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  editIcon:     { fontSize: fs(10) },
  nameBlock:    { flex: 1, gap: ms(2) },
  displayName:  { color: colors.text, fontSize: fs(18), fontWeight: '700' },
  username:     { color: colors.textSecondary, fontSize: fs(13) },
  bio:          { color: colors.textMuted, fontSize: fs(12), lineHeight: fs(17), marginTop: ms(4) },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: colors.cardAlt, borderRadius: ms(12), paddingVertical: ms(12),
  },
  statItem:     { alignItems: 'center', flex: 1 },
  statValue:    { color: colors.text, fontSize: fs(18), fontWeight: '700' },
  statLabel:    { color: colors.textMuted, fontSize: fs(11), marginTop: ms(2) },
  divider:      { width: 1, backgroundColor: colors.border, marginVertical: ms(4) },
  platformsRow: { flexDirection: 'row', gap: ms(8), flexWrap: 'wrap' },
  platformChip: {
    backgroundColor: colors.purpleMuted, borderRadius: ms(8),
    paddingHorizontal: ms(10), paddingVertical: ms(5),
    borderWidth: 1, borderColor: colors.purpleBorder,
  },
  platformText: { color: colors.textSecondary, fontSize: fs(11), fontWeight: '600' },
});
