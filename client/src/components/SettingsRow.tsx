import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
import { rw, rh, rf } from '@/utils/responsive';

export interface SettingsRowProps {
  icon?: string; // MaterialIcons name
  emoji?: string;
  iconImage?: ImageSourcePropType;
  iconBg?: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  value?: string;
  onPress?: () => void;
  showDivider?: boolean;
}

export function SettingsRow({
  icon, emoji, iconImage, iconBg, iconColor,
  label, sublabel, value, onPress, showDivider = false,
}: SettingsRowProps) {
  const { colors } = useTheme();
  const resolvedIconColor = iconColor ?? colors.purple;
  const bg = iconBg ?? colors.purpleMuted;

  let iconEl: React.ReactNode = null;
  if (iconImage) {
    iconEl = <Image source={iconImage} style={styles.iconImage} resizeMode="contain" />;
  } else if (emoji) {
    iconEl = <Text style={{ fontSize: rw(18) }}>{emoji}</Text>;
  } else if (icon) {
    iconEl = <MaterialIcons name={icon as any} size={rw(19)} color={resolvedIconColor} />;
  }

  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.iconBox, { backgroundColor: bg }]}>
          {iconEl}
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {sublabel ? <Text style={[styles.value, { color: colors.textMuted }]}>{sublabel}</Text> : null}
          {value ? (
            <Text style={[styles.value, { color: colors.textMuted }, value.startsWith('●') && { color: colors.online }]}>
              {value}
            </Text>
          ) : null}
        </View>
        <MaterialIcons name="chevron-right" size={rw(17)} color={colors.textMuted} />
      </TouchableOpacity>
      {showDivider && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
    </>
  );
}

export interface SettingsSwitchRowProps {
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  showDivider?: boolean;
}

export function SettingsSwitchRow({
  icon, iconBg, iconColor,
  label, sublabel, value, onValueChange, showDivider = false,
}: SettingsSwitchRowProps) {
  const { colors } = useTheme();
  const resolvedIconColor = iconColor ?? colors.purple;
  const bg = iconBg ?? colors.purpleMuted;

  return (
    <>
      <View style={styles.row}>
        {icon ? (
          <View style={[styles.iconBox, { backgroundColor: bg }]}>
            <MaterialIcons name={icon as any} size={rw(19)} color={resolvedIconColor} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {sublabel ? <Text style={[styles.value, { color: colors.textMuted }]}>{sublabel}</Text> : null}
        </View>
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
  row: { flexDirection: 'row', alignItems: 'center', padding: rw(14), gap: rw(12) },
  iconBox: { width: rw(36), height: rw(36), borderRadius: rw(10), alignItems: 'center', justifyContent: 'center' },
  iconImage: { width: rw(22), height: rw(22) },
  textBlock: { flex: 1, gap: rh(2) },
  label: { fontSize: rf(15), fontWeight: '500' },
  value: { fontSize: rf(12) },
  divider: { height: 1, marginHorizontal: rw(14) },
});
