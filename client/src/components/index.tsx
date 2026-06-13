import React from 'react';
import {
  View, Text, Image, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Switch,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { useTheme } from '@/context/ThemeContext';
import { getProfileAvatar } from '@/services/mockData';
import { resolveAvatarSource } from '@/constants/avatars';

// ─── AppButton ────────────────────────────────────────────────────────────────
export function AppButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        btnStyles.btn,
        {
          backgroundColor: isPrimary ? colors.purple : colors.card,
          borderColor: colors.purpleBorder,
          borderWidth: isPrimary ? 0 : 1,
          opacity: disabled || loading ? 0.6 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={[btnStyles.label, { color: isPrimary ? '#fff' : colors.purple }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
const btnStyles = StyleSheet.create({
  btn: { borderRadius: rw(12), paddingVertical: rh(14), alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: rf(16), fontWeight: '600' },
});

// ─── ProfileHeader ────────────────────────────────────────────────────────────
export function ProfileHeader({
  name,
  email,
  avatar,
  stats = [],
  platforms = [],
}: {
  name: string;
  email?: string;
  avatar?: string;
  stats?: { icon: string; iconColor: string; value: string | number; label: string }[];
  platforms?: string[];
}) {
  const { colors } = useTheme();
  const avatarSource = resolveAvatarSource(avatar || getProfileAvatar(name), name);

  return (
    <View style={[phStyles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={[phStyles.avatarRing, { borderColor: colors.purple }]}>
        <Image source={avatarSource} style={phStyles.avatar} />
      </View>
      <Text style={[phStyles.name, { color: colors.text }]}>{name}</Text>
      {email ? <Text style={[phStyles.email, { color: colors.textMuted }]}>{email}</Text> : null}
      {stats.length > 0 && (
        <View style={phStyles.stats}>
          {stats.map((s, i) => (
            <View key={i} style={phStyles.statItem}>
              <MaterialIcons name={s.icon as any} size={rw(20)} color={s.iconColor} />
              <Text style={[phStyles.statValue, { color: colors.text }]}>{s.value}</Text>
              <Text style={[phStyles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
const phStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: rh(24), paddingHorizontal: rs.xl, borderBottomWidth: 1 },
  avatarRing: { width: rw(88), height: rw(88), borderRadius: rw(44), borderWidth: 3, overflow: 'hidden', marginBottom: rh(12) },
  avatar: { width: '100%', height: '100%' },
  name: { fontSize: rf(20), fontWeight: '700', marginBottom: rh(4) },
  email: { fontSize: rf(14), marginBottom: rh(16) },
  stats: { flexDirection: 'row', gap: rw(24) },
  statItem: { alignItems: 'center', gap: rh(4) },
  statValue: { fontSize: rf(16), fontWeight: '700' },
  statLabel: { fontSize: rf(12) },
});

// ─── GameCard ─────────────────────────────────────────────────────────────────
export function GameCard({
  id,
  name,
  cover,
  rank,
  totalHours,
  totalAchievements,
  completedAchievements,
  platform,
  width,
  onPress,
}: {
  id: string;
  name: string;
  cover: string;
  rank?: number;
  totalHours?: number;
  totalAchievements?: number;
  completedAchievements?: number;
  platform?: string;
  width?: number;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const cardW = width || rw(160);
  const completion =
    totalAchievements && completedAchievements !== undefined
      ? Math.round((completedAchievements / totalAchievements) * 100)
      : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[gcStyles.card, { width: cardW, backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <Image source={{ uri: cover }} style={[gcStyles.cover, { width: cardW, height: cardW * 1.35 }]} resizeMode="cover" />
      <View style={gcStyles.info}>
        <Text style={[gcStyles.name, { color: colors.text }]} numberOfLines={2}>{name}</Text>
        {totalHours !== undefined && (
          <Text style={[gcStyles.meta, { color: colors.textMuted }]}>{totalHours}h jugadas</Text>
        )}
        {completion !== null && (
          <View style={gcStyles.progressRow}>
            <View style={[gcStyles.progressBg, { backgroundColor: colors.cardBorder }]}>
              <View style={[gcStyles.progressFill, { width: `${completion}%` as any, backgroundColor: colors.purple }]} />
            </View>
            <Text style={[gcStyles.progressLabel, { color: colors.textMuted }]}>{completion}%</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
const gcStyles = StyleSheet.create({
  card: { borderRadius: rw(12), borderWidth: 1, overflow: 'hidden', marginBottom: rh(8) },
  cover: {},
  info: { padding: rs.sm },
  name: { fontSize: rf(13), fontWeight: '600', marginBottom: rh(4) },
  meta: { fontSize: rf(11), marginBottom: rh(6) },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: rw(6) },
  progressBg: { flex: 1, height: rh(4), borderRadius: rh(2), overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: rh(2) },
  progressLabel: { fontSize: rf(10), width: rw(28) },
});

// ─── SettingsRow ──────────────────────────────────────────────────────────────
export function SettingsRow({
  label,
  sublabel,
  iconName,
  iconImage,
  onPress,
  rightLabel,
}: {
  label: string;
  sublabel?: string;
  iconName?: string;
  iconImage?: any;
  onPress?: () => void;
  rightLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[srStyles.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
    >
      {iconName ? (
        <MaterialIcons name={iconName as any} size={rw(22)} color={colors.purple} style={srStyles.icon} />
      ) : iconImage ? (
        <Image source={iconImage} style={srStyles.imgIcon} />
      ) : null}
      <View style={srStyles.textGroup}>
        <Text style={[srStyles.label, { color: colors.text }]}>{label}</Text>
        {sublabel ? <Text style={[srStyles.sub, { color: colors.textMuted }]}>{sublabel}</Text> : null}
      </View>
      {rightLabel ? (
        <Text style={[srStyles.rightLabel, { color: colors.textMuted }]}>{rightLabel}</Text>
      ) : (
        <MaterialIcons name="chevron-right" size={rw(22)} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}
const srStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: rh(14), paddingHorizontal: rs.md, borderBottomWidth: 1 },
  icon: { marginRight: rs.md },
  imgIcon: { width: rw(22), height: rw(22), resizeMode: 'contain', marginRight: rs.md },
  textGroup: { flex: 1 },
  label: { fontSize: rf(15) },
  sub: { fontSize: rf(12), marginTop: rh(2) },
  rightLabel: { fontSize: rf(14) },
});

// ─── SettingsSwitchRow ────────────────────────────────────────────────────────
export function SettingsSwitchRow({
  label,
  sublabel,
  iconName,
  value,
  onValueChange,
}: {
  label: string;
  sublabel?: string;
  iconName?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[srStyles.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      {iconName ? (
        <MaterialIcons name={iconName as any} size={rw(22)} color={colors.purple} style={srStyles.icon} />
      ) : null}
      <View style={srStyles.textGroup}>
        <Text style={[srStyles.label, { color: colors.text }]}>{label}</Text>
        {sublabel ? <Text style={[srStyles.sub, { color: colors.textMuted }]}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.cardBorder, true: colors.purpleBorder }}
        thumbColor={value ? colors.purple : colors.textMuted}
      />
    </View>
  );
}

// ─── PlayerCard ───────────────────────────────────────────────────────────────
export function PlayerCard({
  name,
  avatar,
  gamesInCommon,
  isOnline,
  onPress,
}: {
  name: string;
  avatar?: string;
  gamesInCommon?: number;
  isOnline?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const avatarSource = resolveAvatarSource(avatar || getProfileAvatar(name), name);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[pcStyles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <View style={pcStyles.avatarWrap}>
        <Image source={avatarSource} style={pcStyles.avatar} />
        {isOnline && <View style={[pcStyles.dot, { backgroundColor: '#22C55E' }]} />}
      </View>
      <Text style={[pcStyles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
      {gamesInCommon !== undefined && (
        <Text style={[pcStyles.meta, { color: colors.textMuted }]}>{gamesInCommon} en común</Text>
      )}
    </TouchableOpacity>
  );
}
const pcStyles = StyleSheet.create({
  card: { alignItems: 'center', padding: rs.md, borderRadius: rw(12), borderWidth: 1, width: rw(100) },
  avatarWrap: { position: 'relative', marginBottom: rh(8) },
  avatar: { width: rw(48), height: rw(48), borderRadius: rw(24) },
  dot: { position: 'absolute', bottom: 0, right: 0, width: rw(12), height: rw(12), borderRadius: rw(6) },
  name: { fontSize: rf(13), fontWeight: '600', textAlign: 'center' },
  meta: { fontSize: rf(11), textAlign: 'center' },
});

// ─── ChatRow ──────────────────────────────────────────────────────────────────
export function ChatRow({
  name,
  avatar,
  lastMessage,
  timestamp,
  onPress,
}: {
  name: string;
  avatar?: string;
  lastMessage?: string;
  timestamp?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const avatarSource = resolveAvatarSource(avatar || getProfileAvatar(name), name);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[crStyles.row, { borderBottomColor: colors.border }]}
    >
      <Image source={avatarSource} style={crStyles.avatar} />
      <View style={crStyles.content}>
        <Text style={[crStyles.name, { color: colors.text }]}>{name}</Text>
        {lastMessage ? <Text style={[crStyles.msg, { color: colors.textMuted }]} numberOfLines={1}>{lastMessage}</Text> : null}
      </View>
      {timestamp ? <Text style={[crStyles.time, { color: colors.textMuted }]}>{timestamp}</Text> : null}
    </TouchableOpacity>
  );
}
const crStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: rh(12), paddingHorizontal: rs.md, borderBottomWidth: 1 },
  avatar: { width: rw(44), height: rw(44), borderRadius: rw(22), marginRight: rs.md },
  content: { flex: 1 },
  name: { fontSize: rf(15), fontWeight: '600' },
  msg: { fontSize: rf(13), marginTop: rh(2) },
  time: { fontSize: rf(12) },
});

// ─── ChatBubble ───────────────────────────────────────────────────────────────
export function ChatBubble({
  message,
  isOwn,
  timestamp,
}: {
  message: string;
  isOwn: boolean;
  timestamp?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[cbStyles.wrap, isOwn ? cbStyles.ownWrap : cbStyles.otherWrap]}>
      <View style={[
        cbStyles.bubble,
        { backgroundColor: isOwn ? colors.purple : colors.card, borderColor: colors.cardBorder },
        isOwn ? cbStyles.ownBubble : cbStyles.otherBubble,
      ]}>
        <Text style={[cbStyles.text, { color: isOwn ? '#fff' : colors.text }]}>{message}</Text>
        {timestamp ? <Text style={[cbStyles.time, { color: isOwn ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>{timestamp}</Text> : null}
      </View>
    </View>
  );
}
const cbStyles = StyleSheet.create({
  wrap: { marginVertical: rh(4), marginHorizontal: rs.md },
  ownWrap: { alignItems: 'flex-end' },
  otherWrap: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: rw(16), borderWidth: 1, padding: rs.md },
  ownBubble: { borderBottomRightRadius: rw(4) },
  otherBubble: { borderBottomLeftRadius: rw(4) },
  text: { fontSize: rf(14) },
  time: { fontSize: rf(10), marginTop: rh(4), textAlign: 'right' },
});

// ─── SearchBar ────────────────────────────────────────────────────────────────
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar...',
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[sbStyles.wrap, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <MaterialIcons name="search" size={rw(20)} color={colors.textMuted} style={sbStyles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[sbStyles.input, { color: colors.text }]}
      />
    </View>
  );
}
const sbStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', borderRadius: rw(12), borderWidth: 1, paddingHorizontal: rs.md, marginHorizontal: rs.md, marginVertical: rh(8) },
  icon: { marginRight: rs.sm },
  input: { flex: 1, fontSize: rf(15), paddingVertical: rh(12) },
});

// ─── InfoCard ─────────────────────────────────────────────────────────────────
export function InfoCard({
  title,
  miniTitle,
  value,
  description,
  icon,
  iconColor,
  iconBg,
  emoji,
  layout = 'vertical',
}: {
  title: string;
  miniTitle?: string;
  value?: string | number;
  description?: string;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  emoji?: string;
  layout?: 'vertical' | 'horizontal';
}) {
  const { colors } = useTheme();

  if (layout === 'horizontal') {
    return (
      <View style={[icStyles.cardH, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[icStyles.iconCircle, { backgroundColor: iconBg || colors.purpleDim }]}>
          {emoji
            ? <Text style={{ fontSize: rf(22) }}>{emoji}</Text>
            : icon
            ? <MaterialIcons name={icon as any} size={rw(22)} color={iconColor || colors.purple} />
            : null}
        </View>
        <View style={icStyles.hText}>
          <Text style={[icStyles.hTitle, { color: colors.text }]}>{title}</Text>
          {miniTitle ? <Text style={[icStyles.miniTitle, { color: colors.textMuted }]}>{miniTitle}</Text> : null}
          {description ? <Text style={[icStyles.desc, { color: colors.textMuted }]}>{description}</Text> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[icStyles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {miniTitle ? <Text style={[icStyles.miniTitle, { color: colors.textMuted }]}>{miniTitle}</Text> : null}
      <View style={[icStyles.iconCircle, { backgroundColor: iconBg || colors.purpleDim }]}>
        {emoji
          ? <Text style={{ fontSize: rf(22) }}>{emoji}</Text>
          : icon
          ? <MaterialIcons name={icon as any} size={rw(22)} color={iconColor || colors.purple} />
          : null}
      </View>
      {value !== undefined ? <Text style={[icStyles.value, { color: colors.text }]}>{value}</Text> : null}
      <Text style={[icStyles.title, { color: colors.textMuted }]}>{title}</Text>
      {description ? <Text style={[icStyles.desc, { color: colors.textMuted }]}>{description}</Text> : null}
    </View>
  );
}
const icStyles = StyleSheet.create({
  card: { alignItems: 'center', padding: rs.md, borderRadius: rw(12), borderWidth: 1, flex: 1, gap: rh(6) },
  cardH: { flexDirection: 'row', alignItems: 'center', padding: rs.md, borderRadius: rw(12), borderWidth: 1, gap: rw(14) },
  iconCircle: { width: rw(44), height: rw(44), borderRadius: rw(22), alignItems: 'center', justifyContent: 'center' },
  miniTitle: { fontSize: rf(10), fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  value: { fontSize: rf(20), fontWeight: '700' },
  title: { fontSize: rf(12), textAlign: 'center' },
  hText: { flex: 1 },
  hTitle: { fontSize: rf(15), fontWeight: '600' },
  desc: { fontSize: rf(12), marginTop: rh(2) },
});
