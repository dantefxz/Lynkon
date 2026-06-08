import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors } from '@/theme/colors';
import { rw, rh, rf } from '@/utils/responsive';

// ── Lista de conversaciones ────────────────────────────
export interface ChatRowProps {
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastMessage?: string;
  timestamp?: string;
  unread?: number;
  onPress: () => void;
}

export function ChatRow({
  name, avatar, isOnline = false,
  lastMessage, timestamp, unread = 0, onPress,
}: ChatRowProps) {
  const avatarSize = rw(46);

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Avatar + online */}
      <View style={styles.avatarWrapper}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }} />
        ) : (
          <View style={[styles.avatarFallback, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
            <MaterialIcons name="person-outline" size={rw(22)} color={colors.purple} />
          </View>
        )}
        <View style={[styles.onlineDot, { backgroundColor: isOnline ? colors.online : colors.textMuted }]} />
      </View>

      {/* Texto */}
      <View style={styles.textBlock}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {lastMessage && (
          <Text style={styles.lastMsg} numberOfLines={1}>{lastMessage}</Text>
        )}
      </View>

      {/* Derecha */}
      <View style={styles.right}>
        {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
        {unread > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.purple }]}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Burbuja de mensaje individual ─────────────────────
export interface ChatBubbleProps {
  message: string;
  timestamp: string;
  isOwn: boolean;
}

export function ChatBubble({ message, timestamp, isOwn }: ChatBubbleProps) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
      <View style={[
        styles.bubble,
        isOwn
          ? { backgroundColor: colors.purple, borderBottomRightRadius: rw(4) }
          : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: rw(4) },
      ]}>
        <Text style={[styles.bubbleText, { color: isOwn ? '#fff' : colors.text }]}>{message}</Text>
        <Text style={[styles.bubbleTime, { color: isOwn ? 'rgba(255,255,255,0.65)' : colors.textMuted }]}>
          {timestamp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ChatRow
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: rw(12),
    borderRadius: rw(14),
    borderWidth: 1,
    gap: rw(12),
  },
  avatarWrapper: { position: 'relative' },
  avatarFallback: {
    backgroundColor: colors.purpleMuted,
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
  textBlock: { flex: 1, gap: rh(3) },
  name: { color: colors.text, fontSize: rf(15), fontWeight: '600' },
  lastMsg: { color: colors.textMuted, fontSize: rf(13) },
  right: { alignItems: 'flex-end', gap: rh(4) },
  timestamp: { color: colors.textMuted, fontSize: rf(11) },
  badge: {
    minWidth: rw(18),
    height: rw(18),
    borderRadius: rw(9),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rw(4),
  },
  badgeText: { color: '#fff', fontSize: rf(10), fontWeight: '700' },
  // ChatBubble
  bubble: {
    maxWidth: '75%',
    borderRadius: rw(16),
    padding: rw(12),
    gap: rh(4),
  },
  bubbleText: { fontSize: rf(14), lineHeight: rh(20) },
  bubbleTime: { fontSize: rf(11), textAlign: 'right' },
});
