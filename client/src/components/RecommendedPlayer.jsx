// src/components/RecommendedPlayer.jsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { ms, fs, wp, isSmallScreen } from '../theme/responsive';

const CARD_WIDTH = isSmallScreen ? ms(95) : ms(110);

export function RecommendedPlayer({ user, onAdd, isAdded }) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        {user.isOnline && <View style={styles.onlineDot} />}
      </View>
      <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
      <View style={styles.commonBadge}>
        <Text style={styles.commonText}>{user.gamesInCommon} en común</Text>
      </View>
      <TouchableOpacity
        style={[styles.addBtn, isAdded && styles.addBtnAdded]}
        onPress={() => !isAdded && onAdd(user.id)}
        activeOpacity={0.8}
        disabled={isAdded}
      >
        <Text style={[styles.addText, isAdded && styles.addTextAdded]}>
          {isAdded ? '✓ Enviada' : '+ Agregar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH, alignItems: 'center',
    backgroundColor: colors.card, borderRadius: ms(14),
    borderWidth: 1, borderColor: colors.border,
    padding: ms(12), marginRight: ms(12),
  },
  avatarWrapper:  { position: 'relative', marginBottom: ms(8) },
  avatar:         { width: ms(60), height: ms(60), borderRadius: ms(30), borderWidth: 2, borderColor: colors.purpleBorder },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: ms(14), height: ms(14), borderRadius: ms(7),
    backgroundColor: colors.online, borderWidth: 2, borderColor: colors.card,
  },
  name:        { color: colors.text, fontSize: fs(12), fontWeight: '600', textAlign: 'center', marginBottom: ms(4) },
  commonBadge: { backgroundColor: colors.purpleMuted, borderRadius: ms(6), paddingHorizontal: wp(6), paddingVertical: ms(3), marginBottom: ms(8) },
  commonText:  { color: colors.textSecondary, fontSize: fs(9), fontWeight: '500' },
  addBtn:      { backgroundColor: colors.purple, borderRadius: ms(8), paddingVertical: ms(6), paddingHorizontal: wp(10), width: '100%', alignItems: 'center' },
  addBtnAdded: { backgroundColor: colors.purpleMuted },
  addText:     { color: '#fff', fontSize: fs(10), fontWeight: '600' },
  addTextAdded:{ color: colors.textSecondary },
});
