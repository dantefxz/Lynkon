/**
 * AppButton
 * ---------
 * Botón reutilizable con variantes: primary | secondary | destructive | ghost.
 * Soporta estado de carga (spinner) y ícono opcional.
 * Usado en: todas las pantallas.
 */
import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { rw, rh, rf } from '@/utils/responsive';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; border: string; text: string }> = {
  primary:     { bg: colors.purple,      border: colors.purple,       text: '#fff' },
  secondary:   { bg: colors.card,        border: colors.purpleBorder,  text: colors.text },
  destructive: { bg: 'transparent',      border: colors.error,         text: colors.error },
  ghost:       { bg: 'transparent',      border: 'transparent',        text: colors.purpleLight },
};

export function AppButton({
  label, onPress, variant = 'primary',
  loading = false, disabled = false,
  icon, fullWidth = true, style,
}: AppButtonProps) {
  const v = variantStyles[variant];
  const opacity = disabled || loading ? 0.55 : 1;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border, opacity },
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon && (
            <Ionicons name={icon} size={rw(18)} color={v.text} style={styles.icon} />
          )}
          <Text style={[styles.label, { color: v.text }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rh(14),
    paddingHorizontal: rw(20),
    borderRadius: rw(12),
    borderWidth: 1,
    gap: rw(8),
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize: rf(15),
    fontWeight: '600',
  },
  icon: {
    marginRight: rw(2),
  },
});
