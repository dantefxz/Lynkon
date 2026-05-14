// src/components/SettingsButton.jsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { ms, fs } from '../theme/responsive';

export function SettingsButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.icon}>⚙️</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: ms(38), height: ms(38), borderRadius: ms(10),
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: fs(18) },
});
