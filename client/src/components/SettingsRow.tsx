/**
 * SettingsRow
 * -----------
 * Fila de configuración: ícono/emoji en caja, label, valor opcional y flecha/switch.
 * Usado en: settings screen, platform detail.
 */
import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { rw, rh, rf } from '@/utils/responsive';

export interface SettingsRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  /** Emoji como alternativa al icon de Ionicons */
  emoji?: string;
  iconImage?: ImageSourcePropType;
  iconBg?: string;
  iconColor?: string;
  label: string;
  value?: string;
  onPress: () => void;
  showDivider?: boolean;
}

export function SettingsRow({
  icon, emoji, iconImage, iconBg, iconColor = colors.purple,
  label, value, onPress, showDivider = false,
}: SettingsRowProps) {
  const bg = iconBg ?? colors.purpleMuted;

  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.iconBox, { backgroundColor: bg }]}>
          {iconImage ? (
            <Image source={iconImage} style={styles.iconImage} resizeMode="contain" />
          ) : emoji ? (
            <Text style={{ fontSize: rw(18) }}>{emoji}</Text>
          ) : icon ? (
            <Ionicons name={icon} size={rw(19)} color={iconColor} />
          ) : null}
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.label}>{label}</Text>
          {value ? (
            <Text style={[styles.value, value.startsWith('●') && { color: colors.online }]}>
              {value}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={rw(17)} color={colors.textMuted} />
      </TouchableOpacity>
      {showDivider && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
    </>
  );
}

export interface SettingsSwitchRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  iconColor?: string;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  showDivider?: boolean;
}

export function SettingsSwitchRow({
  icon, iconBg, iconColor = colors.purple,
  label, value, onValueChange, showDivider = false,
}: SettingsSwitchRowProps) {
  const bg = iconBg ?? colors.purpleMuted;

  return (
    <>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={rw(19)} color={iconColor} />
        </View>
        <Text style={[styles.label, { flex: 1 }]}>{label}</Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.textMuted, true: colors.purple }}
          thumbColor="#fff"
        />
      </View>
      {showDivider && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: rw(14),
    gap: rw(12),
  },
  iconBox: {
    width: rw(36),
    height: rw(36),
    borderRadius: rw(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: rw(22),
    height: rw(22),
  },
  textBlock: { flex: 1, gap: rh(2) },
  label: { color: colors.text, fontSize: rf(15), fontWeight: '500' },
  value: { color: colors.textMuted, fontSize: rf(12) },
  divider: { height: 1, marginHorizontal: rw(14) },
});
