// src/components/ChatPlayer.jsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { ms, fs, wp } from '../theme/responsive';

export function ChatPlayer({ user, lastMessage, timestamp, unread = 0, onPress, onLongPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.85}>
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <View style={[styles.statusDot, user.isOnline ? styles.online : styles.offline]} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
          {timestamp && <Text style={styles.time}>{timestamp}</Text>}
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.lastMsg} numberOfLines={1}>
            {lastMessage || (user.isOnline ? 'En línea' : 'Desconectado')}
          </Text>
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: ms(14),
    borderWidth: 1, borderColor: colors.border,
    padding: ms(12), marginBottom: ms(10), gap: ms(12),
  },
  avatarWrapper:  { position: 'relative', flexShrink: 0 },
  avatar:         { width: ms(50), height: ms(50), borderRadius: ms(25) },
  statusDot:      { position: 'absolute', bottom: 1, right: 1, width: ms(12), height: ms(12), borderRadius: ms(6), borderWidth: 2, borderColor: colors.card },
  online:         { backgroundColor: colors.online },
  offline:        { backgroundColor: '#6B7280' },
  body:           { flex: 1 },
  topRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ms(4) },
  name:           { color: colors.text, fontSize: fs(14), fontWeight: '600', flex: 1 },
  time:           { color: colors.textMuted, fontSize: fs(11), marginLeft: ms(8) },
  bottomRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMsg:        { color: colors.textMuted, fontSize: fs(12), flex: 1 },
  unreadBadge:    { backgroundColor: colors.purple, borderRadius: ms(10), minWidth: ms(20), height: ms(20), alignItems: 'center', justifyContent: 'center', paddingHorizontal: ms(5), marginLeft: ms(8) },
  unreadText:     { color: '#fff', fontSize: fs(10), fontWeight: '700' },
});
