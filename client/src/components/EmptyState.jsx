// src/components/EmptyState.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LynkonButton } from './LynkonButton';
import { colors } from '../theme/colors';
import { ms, fs, wp } from '../theme/responsive';

export function EmptyState({ icon = '🎮', title, description, actionLabel, onAction, secondaryLabel, onSecondary }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <LynkonButton title={actionLabel} onPress={onAction} style={styles.btn} />
      )}
      {secondaryLabel && onSecondary && (
        <LynkonButton title={secondaryLabel} onPress={onSecondary} variant="ghost" style={styles.secondaryBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: wp(32), gap: ms(12) },
  icon:         { fontSize: ms(56), marginBottom: ms(8) },
  title:        { color: colors.text, fontSize: fs(18), fontWeight: '700', textAlign: 'center' },
  description:  { color: colors.textMuted, fontSize: fs(14), textAlign: 'center', lineHeight: fs(20), marginBottom: ms(8) },
  btn:          { width: '100%', marginTop: ms(4) },
  secondaryBtn: { width: '100%' },
});
