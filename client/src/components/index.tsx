import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { SKILL_COLORS, SkillLevel } from '@/utils/skillStorage';
import { useTheme } from '@/context/ThemeContext';
import { getProfileAvatar } from '@/services/mockData';
import { resolveAvatarSource } from '@/constants/avatars';
import { PLATFORM_LOGOS, normalizePlatformId } from '@/constants/platforms';

export { ProfileHeader } from './ProfileHeader';
export { SettingsRow, SettingsSwitchRow } from './SettingsRow';

// ─── AppButton ────────────────────────────────────────────────────────────────
export function AppButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
  icon?: string;
  style?: object;
}) {
  const { colors } = useTheme();
  const isDestructive    = variant === 'destructive';
  const isPrimary        = variant === 'primary';
  const nonDestructiveBg = isPrimary ? colors.purple : colors.card;
  const bgColor          = isDestructive ? '#EF4444' : nonDestructiveBg;
  const textColor     = isDestructive || isPrimary ? '#fff' : colors.purple;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        btnStyles.btn,
        {
          backgroundColor: bgColor,
          borderColor: isDestructive ? '#EF4444' : colors.purpleBorder,
          borderWidth: isPrimary || isDestructive ? 0 : 1,
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={[btnStyles.label, { color: textColor }]}>
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

// ─── GameCard ─────────────────────────────────────────────────────────────────
export function GameCard({
  name, cover, totalHours, totalAchievements, completedAchievements,
  platform, width, skillLevel, onPress, onRemove,
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
  skillLevel?: SkillLevel | null;
  onPress?: () => void;
  onRemove?: () => void;
}) {
  const { colors } = useTheme();
  const { t }      = useTranslation();
  const cardW      = width || rw(160);
  const [imgError, setImgError] = useState(false);
  const completion =
    totalAchievements && completedAchievements !== undefined
      ? Math.round((completedAchievements / totalAchievements) * 100)
      : null;
  const platformId   = platform ? normalizePlatformId(platform) : null;
  const platformLogo = platformId ? PLATFORM_LOGOS[platformId] : null;
  const hideHours         = platformId ? ['xbox', 'psn', 'playstation'].includes(platformId) : false;
  const noAchievementsText = (!hideHours && totalHours) ? t('profile.hoursPlayed', { hours: totalHours }) : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[gcStyles.card, { width: cardW, backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      {cover && !imgError ? (
        <Image
          source={{ uri: cover }}
          style={[gcStyles.cover, { width: cardW, height: cardW * 1.35 }]}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={[gcStyles.cover, gcStyles.coverPlaceholder, { width: cardW, height: cardW * 1.35, backgroundColor: colors.purpleMuted }]}>
          <MaterialIcons name="videogame-asset" size={rw(36)} color={colors.purple} />
        </View>
      )}
      {onRemove && (
        <TouchableOpacity style={gcStyles.removeBadge} onPress={onRemove} hitSlop={{ top: 6, left: 6, bottom: 6, right: 6 }}>
          <MaterialIcons name="close" size={rw(12)} color="#fff" />
        </TouchableOpacity>
      )}
      <View style={gcStyles.info}>
        <Text style={[gcStyles.name, { color: colors.text }]} numberOfLines={2}>{name}</Text>
        {skillLevel && (
          <View style={[gcStyles.skillBadge, { backgroundColor: SKILL_COLORS[skillLevel] + '22', borderColor: SKILL_COLORS[skillLevel] }]}>
            <Text style={[gcStyles.skillText, { color: SKILL_COLORS[skillLevel] }]}>{t(`game.skillLevel.${skillLevel}` as any)}</Text>
          </View>
        )}
        {completion !== null && (
          <View style={[gcStyles.progressBg, { backgroundColor: colors.cardBorder }]}>
            <View style={[gcStyles.progressFill, { width: `${completion}%` as any, backgroundColor: colors.purple }]} />
          </View>
        )}
        <View style={gcStyles.statsRow}>
          <Text style={[gcStyles.meta, { color: colors.textMuted }]}>
            {completion !== null
              ? `${completedAchievements}/${totalAchievements} · ${completion}%`
              : noAchievementsText}
          </Text>
          {platformLogo && <Image source={platformLogo} style={gcStyles.platformLogo} resizeMode="contain" />}
        </View>
        {completion !== null && !!totalHours && !hideHours && (
          <Text style={[gcStyles.meta, { color: colors.textMuted }]}>{t('profile.hoursPlayed', { hours: totalHours })}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
const gcStyles = StyleSheet.create({
  card:          { borderRadius: rw(12), borderWidth: 1, overflow: 'hidden', marginBottom: rh(8) },
  cover:         {},
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  removeBadge:   { position: 'absolute', top: rw(8), left: rw(8), backgroundColor: 'rgba(0,0,0,0.65)', padding: rw(5), borderRadius: rw(7) },
  info:          { padding: rs.sm, gap: rh(4) },
  name:          { fontSize: rf(13), fontWeight: '600' },
  skillBadge:    { alignSelf: 'flex-start', borderWidth: 1, borderRadius: rw(20), paddingHorizontal: rw(7), paddingVertical: rh(2) },
  skillText:     { fontSize: rf(10), fontWeight: '700' },
  statsRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta:          { fontSize: rf(11) },
  platformLogo:  { width: rw(13), height: rw(13) },
  progressBg:    { height: rh(4), borderRadius: rh(2), overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: rh(2) },
});


// ─── PlayerCard ───────────────────────────────────────────────────────────────
export function PlayerCard({
  name, avatar, gamesInCommon, isOnline, onPress,
  actionLabel, onAction, actionDisabled,
}: {
  id?: string;
  name: string;
  avatar?: string;
  gamesInCommon?: number;
  isOnline?: boolean;
  onPress?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const avatarSource = resolveAvatarSource(avatar || getProfileAvatar(name), name);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[pcStyles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <View style={pcStyles.avatarWrap}>
        <Image source={avatarSource} style={pcStyles.avatar} />
        {isOnline && <View style={[pcStyles.dot, { backgroundColor: '#22C55E' }]} />}
      </View>
      <View style={pcStyles.info}>
        <Text style={[pcStyles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
        {gamesInCommon !== undefined && gamesInCommon > 0 && (
          <Text style={[pcStyles.meta, { color: colors.textMuted }]}>
            {t('social.inCommon', { count: gamesInCommon, plural: gamesInCommon !== 1 ? 's' : '' })}
          </Text>
        )}
      </View>
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          disabled={actionDisabled}
          style={[pcStyles.actionBtn, { backgroundColor: actionDisabled ? colors.card : colors.purple, borderColor: actionDisabled ? colors.border : colors.purple }]}
        >
          <Text style={[pcStyles.actionText, { color: actionDisabled ? colors.textMuted : '#fff' }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
const pcStyles = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', padding: rs.md, borderRadius: rw(12), borderWidth: 1, gap: rw(12) },
  avatarWrap: { position: 'relative' },
  avatar:     { width: rw(44), height: rw(44), borderRadius: rw(22) },
  dot:        { position: 'absolute', bottom: 0, right: 0, width: rw(11), height: rw(11), borderRadius: rw(6), borderWidth: 2, borderColor: '#fff' },
  info:       { flex: 1, gap: rh(2) },
  name:       { fontSize: rf(14), fontWeight: '600' },
  meta:       { fontSize: rf(12) },
  actionBtn:  { paddingHorizontal: rw(12), paddingVertical: rh(6), borderRadius: rw(16), borderWidth: 1 },
  actionText: { fontSize: rf(12), fontWeight: '600' },
});

// ─── ChatRow ──────────────────────────────────────────────────────────────────
export function ChatRow({
  name, avatar, lastMessage, timestamp, isOnline, unreadCount, onPress, onRemove,
}: {
  name: string;
  avatar?: string;
  lastMessage?: string;
  timestamp?: string;
  isOnline?: boolean;
  unreadCount?: number;
  onPress?: () => void;
  onRemove?: () => void;
}) {
  const { colors } = useTheme();
  const avatarSource = resolveAvatarSource(avatar || getProfileAvatar(name), name);
  const rawCount   = unreadCount ?? 0;
  const badgeLabel = rawCount > 99 ? '+99' : String(rawCount);
  const badgeCount = rawCount > 0 ? badgeLabel : null;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[crStyles.row, { borderBottomColor: colors.border }]}
    >
      <View style={crStyles.avatarWrap}>
        <Image source={avatarSource} style={crStyles.avatar} />
        {isOnline && <View style={[crStyles.dot, { backgroundColor: '#22C55E' }]} />}
        {badgeCount && (
          <View style={crStyles.badge}>
            <Text style={crStyles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </View>
      <View style={crStyles.content}>
        <Text style={[crStyles.name, { color: colors.text, fontWeight: badgeCount ? '700' : '600' }]}>{name}</Text>
        {lastMessage ? <Text style={[crStyles.msg, { color: badgeCount ? colors.text : colors.textMuted, fontWeight: badgeCount ? '600' : '400' }]} numberOfLines={1}>{lastMessage}</Text> : null}
      </View>
      {timestamp ? <Text style={[crStyles.time, { color: colors.textMuted }]}>{timestamp}</Text> : null}
      {onRemove && (
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={crStyles.removeBtn}>
          <MaterialIcons name="person-remove" size={rw(18)} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
const crStyles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: rh(12), paddingHorizontal: rs.md, borderBottomWidth: 1 },
  avatarWrap:{ position: 'relative' },
  avatar:    { width: rw(44), height: rw(44), borderRadius: rw(22), marginRight: rs.md },
  dot:       { position: 'absolute', bottom: 0, right: rs.md, width: rw(11), height: rw(11), borderRadius: rw(6), borderWidth: 2, borderColor: '#fff' },
  badge:     { position: 'absolute', top: -rh(3), right: rs.md - rw(6), minWidth: rw(18), height: rw(18), borderRadius: rw(9), backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: rw(3) },
  badgeText: { color: '#fff', fontSize: rf(9), fontWeight: '700', lineHeight: rf(12) },
  content:   { flex: 1 },
  name:      { fontSize: rf(15), fontWeight: '600' },
  msg:       { fontSize: rf(13), marginTop: rh(2) },
  time:      { fontSize: rf(12) },
  removeBtn: { padding: rw(4), marginLeft: rw(8) },
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
  placeholder = 'Search...',
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
function InfoIcon({ emoji, icon, iconColor, purple }: { emoji?: string; icon?: string; iconColor?: string; purple: string }) {
  if (emoji) return <Text style={{ fontSize: rf(22) }}>{emoji}</Text>;
  if (icon) return <MaterialIcons name={icon as any} size={rw(22)} color={iconColor || purple} />;
  return null;
}

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
          <InfoIcon emoji={emoji} icon={icon} iconColor={iconColor} purple={colors.purple} />
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
        <InfoIcon emoji={emoji} icon={icon} iconColor={iconColor} purple={colors.purple} />
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
