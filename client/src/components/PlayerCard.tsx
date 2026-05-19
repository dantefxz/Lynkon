/**
 * PlayerCard
 * ----------
 * Card de jugador recomendado con avatar, nombre, juegos en común y botón de acción.
 * Usado en: social (sugerencias de amigos, resultados de búsqueda).
 */
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors } from '@/theme/colors';
import { rw, rh, rf } from '@/utils/responsive';
import { AppButton } from './AppButton';

export interface PlayerCardProps {
  id: string;
  name: string;
  avatar?: string;
  gamesInCommon?: number;
  isOnline?: boolean;
  /** Texto del botón de acción */
  actionLabel?: string;
  onAction?: () => void;
  onPress?: () => void;
}

export function PlayerCard({
  name, avatar, gamesInCommon = 0,
  isOnline = false, actionLabel = 'Ver perfil',
  onAction, onPress,
}: PlayerCardProps) {
  const avatarSize = rw(48);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
          />
        ) : (
          <View style={[
            styles.avatarFallback,
            { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: colors.purpleMuted },
          ]}>
            <MaterialIcons name="person-outline" size={rw(22)} color={colors.purple} />
          </View>
        )}
        {/* Indicador online */}
        <View style={[
          styles.onlineDot,
          { backgroundColor: isOnline ? colors.online : colors.textMuted },
        ]} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {gamesInCommon > 0 && (
          <Text style={styles.gamesCommon}>
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
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: rw(11),
    height: rw(11),
    borderRadius: rw(6),
    borderWidth: 2,
    borderColor: colors.card,
  },
  info: {
    flex: 1,
    gap: rh(3),
  },
  name: {
    color: colors.text,
    fontSize: rf(15),
    fontWeight: '600',
  },
  gamesCommon: {
    color: colors.textMuted,
    fontSize: rf(12),
  },
  actionBtn: {
    paddingVertical: rh(7),
    paddingHorizontal: rw(14),
  },
});
