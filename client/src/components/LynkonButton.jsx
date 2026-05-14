// src/components/LynkonButton.jsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors } from '../theme/colors';
import { ms, fs, wp } from '../theme/responsive';

export function LynkonButton({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon, style,
}) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], styles[`size_${size}`], isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:           { borderRadius: ms(12), alignItems: 'center', justifyContent: 'center' },
  content:        { flexDirection: 'row', alignItems: 'center', gap: ms(8) },
  icon:           { marginRight: ms(4) },
  primary:        { backgroundColor: colors.purple },
  secondary:      { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  danger:         { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' },
  ghost:          { backgroundColor: 'transparent' },
  size_sm:        { paddingVertical: ms(8),  paddingHorizontal: wp(14) },
  size_md:        { paddingVertical: ms(14), paddingHorizontal: wp(20) },
  size_lg:        { paddingVertical: ms(18), paddingHorizontal: wp(24) },
  text:           { fontWeight: '600' },
  text_primary:   { color: '#fff' },
  text_secondary: { color: colors.text },
  text_danger:    { color: '#EF4444' },
  text_ghost:     { color: colors.purpleLight },
  textSize_sm:    { fontSize: fs(13) },
  textSize_md:    { fontSize: fs(15) },
  textSize_lg:    { fontSize: fs(17) },
  disabled:       { opacity: 0.5 },
});
