/**
 * InfoCard
 * --------
 * Card informativa con ícono/logo, mini-título (label), título principal y texto.
 * Usado en: platform detail (stats), game detail (estadísticas), settings (secciones).
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { rw, rh, rf } from '@/utils/responsive';

export interface InfoCardProps {
  /** Ícono de Ionicons o emoji string */
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  iconBg?: string;
  iconColor?: string;
  /** Texto pequeño encima del título (ej: "PLATAFORMA") */
  miniTitle?: string;
  title: string;
  /** Valor/número grande a mostrar */
  value?: string | number;
  /** Texto descriptivo debajo del título */
  description?: string;
  style?: ViewStyle;
  /** Modo horizontal (ícono a la izquierda) vs vertical (ícono arriba, centrado) */
  layout?: 'horizontal' | 'vertical';
}

export function InfoCard({
  icon, emoji, iconBg, iconColor = colors.purple,
  miniTitle, title, value, description,
  style, layout = 'horizontal',
}: InfoCardProps) {
  const bg = iconBg ?? colors.purpleMuted;

  const IconEl = () => (
    <View style={[styles.iconWrapper, { backgroundColor: bg, width: rw(40), height: rw(40), borderRadius: rw(11) }]}>
      {emoji ? (
        <Text style={{ fontSize: rw(20) }}>{emoji}</Text>
      ) : icon ? (
        <Ionicons name={icon} size={rw(20)} color={iconColor} />
      ) : null}
    </View>
  );

  if (layout === 'vertical') {
    return (
      <View style={[styles.cardVertical, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
        <IconEl />
        {miniTitle && <Text style={styles.miniTitle}>{miniTitle}</Text>}
        {value !== undefined && <Text style={styles.value}>{value}</Text>}
        <Text style={styles.titleVertical}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.cardHorizontal, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      <IconEl />
      <View style={styles.textBlock}>
        {miniTitle && <Text style={styles.miniTitle}>{miniTitle}</Text>}
        <Text style={styles.titleHorizontal}>{title}</Text>
        {value !== undefined && <Text style={styles.value}>{value}</Text>}
        {description && <Text style={styles.description}>{description}</Text>}
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
    color: colors.textMuted,
    fontSize: rf(10),
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  titleHorizontal: {
    color: colors.text,
    fontSize: rf(15),
    fontWeight: '600',
  },
  titleVertical: {
    color: colors.textMuted,
    fontSize: rf(12),
    textAlign: 'center',
  },
  value: {
    color: colors.text,
    fontSize: rf(22),
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: rf(13),
    lineHeight: rh(18),
  },
});
