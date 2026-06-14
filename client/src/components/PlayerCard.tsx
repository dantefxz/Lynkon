import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { rw, rh, rf } from '@/utils/responsive';
import { AppButton } from './AppButton';
import { getProfileAvatar } from '@/services/mockData';
import { resolveAvatarSource } from '@/constants/avatars';

export interface PlayerCardProps {
  id: string;
  name: string;
  avatar?: string;
  gamesInCommon?: number;
  isOnline?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export function PlayerCard({
  name, avatar, gamesInCommon = 0,
  isOnline = false, actionLabel = 'Ver perfil',
  onAction, actionDisabled = false, onPress, disabled = false,
}: PlayerCardProps) {
  const { colors } = useTheme();
  const avatarSize = rw(48);
  const avatarSource = resolveAvatarSource(avatar || getProfileAvatar(name), name);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: disabled ? 0.5 : 1 }]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.85}
      disabled={disabled}
    >
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        <Image source={avatarSource} style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
        {/* Indicador online */}
        <View style={[
          styles.onlineDot,
          { backgroundColor: isOnline ? colors.online : colors.textMuted, borderColor: colors.card },
        ]} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
        {gamesInCommon > 0 && (
          <Text style={[styles.gamesCommon, { color: colors.textMuted }]}>
            {gamesInCommon} juego{gamesInCommon !== 1 ? 's' : ''} en común
          </Text>
        )}
      </View>

      {/* Acción */}
      {onAction && (
        <AppButton
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          fullWidth={false}
          disabled={actionDisabled}
          style={styles.actionBtn}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: rw(12),
    borderRadius: rw(14),
    borderWidth: 1,
    gap: rw(12),
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {},
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: rw(11),
    height: rw(11),
    borderRadius: rw(6),
    borderWidth: 2,
  },
  info: {
    flex: 1,
    gap: rh(3),
  },
  name: {
    fontSize: rf(15),
    fontWeight: '600',
  },
  gamesCommon: {
    fontSize: rf(12),
  },
  actionBtn: {
    paddingVertical: rh(7),
    paddingHorizontal: rw(14),
  },
});
