import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
import { rw, rh, rf } from '@/utils/responsive';

export interface InfoCardProps {
  icon?: string;
  emoji?: string;
  iconBg?: string;
  iconColor?: string;
  miniTitle?: string;
  title: string;
  value?: string | number;
  description?: string;
  style?: ViewStyle;
  layout?: 'horizontal' | 'vertical';
}

export function InfoCard({
  icon, emoji, iconBg, iconColor,
  miniTitle, title, value, description,
  style, layout = 'horizontal',
}: InfoCardProps) {
  const { colors } = useTheme();
  const resolvedIconColor = iconColor ?? colors.purple;
  const bg = iconBg ?? colors.purpleMuted;

  const IconEl = () => (
    <View style={[styles.iconWrapper, { backgroundColor: bg, width: rw(40), height: rw(40), borderRadius: rw(11) }]}>
      {emoji ? (
        <Text style={{ fontSize: rw(20) }}>{emoji}</Text>
      ) : icon ? (
        <MaterialIcons name={icon as any} size={rw(20)} color={resolvedIconColor} />
      ) : null}
    </View>
  );

  if (layout === 'vertical') {
    return (
      <View style={[styles.cardVertical, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
        <IconEl />
        {miniTitle && <Text style={[styles.miniTitle, { color: colors.textMuted }]}>{miniTitle}</Text>}
        {value !== undefined && <Text style={[styles.value, { color: colors.text }]}>{value}</Text>}
        <Text style={[styles.titleVertical, { color: colors.textMuted }]}>{title}</Text>
        {description && <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.cardHorizontal, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      <IconEl />
      <View style={styles.textBlock}>
        {miniTitle && <Text style={[styles.miniTitle, { color: colors.textMuted }]}>{miniTitle}</Text>}
        <Text style={[styles.titleHorizontal, { color: colors.text }]}>{title}</Text>
        {value !== undefined && <Text style={[styles.value, { color: colors.text }]}>{value}</Text>}
        {description && <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(14),
    padding: rw(16),
    borderRadius: rw(14),
    borderWidth: 1,
  },
  cardVertical: {
    flex: 1,
    alignItems: 'center',
    padding: rw(16),
    borderRadius: rw(14),
    borderWidth: 1,
    gap: rh(4),
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: rh(2),
  },
  miniTitle: {
    fontSize: rf(10),
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  titleHorizontal: {
    fontSize: rf(15),
    fontWeight: '600',
  },
  titleVertical: {
    fontSize: rf(12),
    textAlign: 'center',
  },
  value: {
    fontSize: rf(22),
    fontWeight: '700',
  },
  description: {
    fontSize: rf(13),
    lineHeight: rh(18),
  },
});
