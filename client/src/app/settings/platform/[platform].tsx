import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, AppState,
  Image, ActivityIndicator, Alert, TextInput, Modal, Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ExpoLinking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { platformApi } from '@/services/api';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { PLATFORM_LABELS, PLATFORM_LOGOS, normalizePlatformId } from '@/constants/platforms';
import type { PlatformId } from '@/constants/platforms';

const PLATFORM_NAME_FULL: Record<PlatformId, string> = {
  steam:       'Steam',
  psn:         'PlayStation Network',
  playstation: 'PlayStation Network',
  xbox:        'Xbox Network',
};

const USES_OAUTH: Record<PlatformId, boolean> = {
  steam:       true,
  xbox:        true,
  psn:         false,
  playstation: false,
};

function timeAgo(isoDate: string, t: (key: any, opts?: any) => string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('platform.justNow');
  if (mins < 60) return mins === 1 ? t('platform.minutesAgo', { count: mins }) : t('platform.minutesAgoPlural', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? t('platform.hoursAgo', { count: hrs }) : t('platform.hoursAgoPlural', { count: hrs });
  const days = Math.floor(hrs / 24);
  return days === 1 ? t('platform.daysAgo', { count: days }) : t('platform.daysAgoPlural', { count: days });
}

// ── Sub-components (independent cognitive complexity) ──────────────────────────

function PlatformHeader({ platformLogo, platformLabel, loading, connected, onBack }: {
  platformLogo: any;
  platformLabel: string;
  loading: boolean;
  connected: boolean;
  onBack: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dotColor   = connected ? '#22C55E' : colors.textMuted;
  const statusText = connected ? t('platform.connected') : t('platform.notConnected');

  return (
    <View style={[styles.header, { backgroundColor: colors.backgroundGrad, borderBottomColor: colors.cardBorder }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={rw(24)} color={colors.purple} />
      </TouchableOpacity>
      <View style={styles.platformInfo}>
        {platformLogo
          ? <Image source={platformLogo} style={{ width: rw(36), height: rw(36) }} resizeMode="contain" />
          : <MaterialIcons name="sports-esports" size={rw(30)} color={colors.purple} />}
        <View>
          <Text style={[styles.platformName, { color: colors.text }]}>{platformLabel}</Text>
          {!loading && (
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
              <Text style={{ color: dotColor, fontSize: rf(13) }}>{statusText}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function GameCard({ game, index, platformId }: { game: any; index: number; platformId: PlatformId | null }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router   = useRouter();
  const pct      = game.totalAchievements
    ? Math.round((game.completedAchievements / game.totalAchievements) * 100) : 0;
  const imageUri = game.cover || game.imageUrl || game.iconUrl || null;
  const hours    = game.totalHours ?? game.playtime ?? game.playtimeHours ?? 0;
  const gid      = game.gameId || game.id || String(index);

  return (
    <TouchableOpacity
      style={[styles.gameRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => router.push(`/game/${gid}?platform=${platformId}`)}
      activeOpacity={0.75}
    >
      <View style={styles.gameCoverWrapper}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.gameCover} resizeMode="cover" />
        ) : (
          <View style={[styles.gameCoverPlaceholder, { backgroundColor: colors.purpleDim }]}>
            <MaterialIcons name="sports-esports" size={rw(24)} color={colors.purple} />
          </View>
        )}
        {pct === 100 && game.totalAchievements > 0 && (
          <View style={styles.trophyBadge}>
            <MaterialIcons name="emoji-events" size={rw(11)} color="#000" />
          </View>
        )}
      </View>
      <View style={styles.gameInfo}>
        <Text style={[styles.gameName, { color: colors.text }]} numberOfLines={1}>{game.name || game.title}</Text>
        {!['xbox', 'psn', 'playstation'].includes(platformId ?? '') && (
          <Text style={{ color: colors.textMuted, fontSize: rf(12), marginTop: rh(4) }}>
            {t('platform.hoursPlayedShort', { hours })}
          </Text>
        )}
        {game.totalAchievements > 0 && (
          <View style={{ marginTop: rh(6) }}>
            <View style={[styles.progressBar, { backgroundColor: colors.purpleDim }]}>
              <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.purple }]} />
            </View>
            <Text style={{ color: colors.textMuted, fontSize: rf(11), marginTop: rh(2) }}>
              {t('platform.achievements', { completed: game.completedAchievements, total: game.totalAchievements })}
            </Text>
          </View>
        )}
      </View>
      <MaterialIcons name="chevron-right" size={rw(18)} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function ConnectedView({ games, stats, linkedAt, syncing, platformLabel, platformId, onSync, onUnlink }: {
  games: any[];
  stats: any;
  linkedAt: string | null;
  syncing: boolean;
  platformLabel: string;
  platformId: PlatformId | null;
  onSync: () => void;
  onUnlink: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const hideHours = (['xbox', 'psn', 'playstation'] as string[]).includes(platformId ?? '');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy,      setSortBy]      = useState<'playtime' | 'name'>(hideHours ? 'name' : 'playtime');
  const [sortDir,     setSortDir]     = useState<'asc' | 'desc'>('desc');

  const displayGames = useMemo(() => {
    let result = games;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((g: any) => (g.name || g.title || '').toLowerCase().includes(q));
    }
    return [...result].sort((a: any, b: any) => {
      if (sortBy === 'name') {
        const na = (a.name || a.title || '').toLowerCase();
        const nb = (b.name || b.title || '').toLowerCase();
        return sortDir === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na);
      }
      const ha = a.totalHours ?? a.playtime ?? a.playtimeHours ?? 0;
      const hb = b.totalHours ?? b.playtime ?? b.playtimeHours ?? 0;
      return sortDir === 'asc' ? ha - hb : hb - ha;
    });
  }, [games, searchQuery, sortBy, sortDir]);

  const gamesCountLabel = displayGames.length !== games.length
    ? t('platform.gamesCountFiltered', { count: displayGames.length, total: games.length })
    : t('platform.gamesCount', { count: games.length });

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: rs.md, gap: rh(16) }}>
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.infoCardTitle, { color: colors.text }]}>{t('platform.accountInfo')}</Text>
        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('platform.status')}</Text>
          <Text style={[styles.infoValue, { color: '#22C55E', fontWeight: '600' }]}>{t('platform.connected')}</Text>
        </View>
        {(stats?.totalGames !== undefined || stats?.gamesCount !== undefined || games.length > 0) && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('platform.gamesSync')}</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontWeight: '600' }]}>
              {stats?.totalGames ?? stats?.gamesCount ?? games.length}
            </Text>
          </View>
        )}
        {!hideHours && stats?.totalHours !== undefined && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('platform.hoursPlayed')}</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontWeight: '600' }]}>{stats.totalHours}h</Text>
          </View>
        )}
        {linkedAt && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('platform.lastSync')}</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontWeight: '600' }]}>{timeAgo(linkedAt, t)}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={[styles.unlinkButton, { borderColor: '#EF4444' }]} onPress={onUnlink}>
        <MaterialIcons name="link-off" size={rw(18)} color="#EF4444" />
        <Text style={styles.unlinkText}>{t('platform.unlink', { name: platformLabel })}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.syncButton, { backgroundColor: colors.purple, opacity: syncing ? 0.7 : 1 }]}
        onPress={onSync}
        disabled={syncing}
      >
        {syncing
          ? <ActivityIndicator size="small" color="#fff" />
          : <>
              <MaterialIcons name="refresh" size={rw(18)} color="#fff" />
              <Text style={styles.syncButtonText}>{t('platform.reload', { name: platformLabel })}</Text>
            </>}
      </TouchableOpacity>

      {games.length > 0 && (
        <>
          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <MaterialIcons name="search" size={rw(20)} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('platform.searchGame')}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={rw(18)} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sortRow}>
            <View style={styles.sortGroup}>
              {!hideHours && (
                <TouchableOpacity
                  style={[styles.sortChip, { backgroundColor: sortBy === 'playtime' ? colors.purple : colors.purpleDim }]}
                  onPress={() => setSortBy('playtime')}
                >
                  <Text style={{ color: sortBy === 'playtime' ? '#fff' : colors.textMuted, fontSize: rf(13), fontWeight: '600' }}>
                    {t('platform.hoursPlayed')}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.sortChip, { backgroundColor: sortBy === 'name' ? colors.purple : colors.purpleDim }]}
                onPress={() => setSortBy('name')}
              >
                <Text style={{ color: sortBy === 'name' ? '#fff' : colors.textMuted, fontSize: rf(13), fontWeight: '600' }}>
                  {t('platform.sortName')}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.sortDirBtn, { borderColor: colors.cardBorder }]}
              onPress={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
            >
              <MaterialIcons
                name={sortDir === 'asc' ? 'arrow-upward' : 'arrow-downward'}
                size={rw(18)} color={colors.purple}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>{gamesCountLabel}</Text>

          {displayGames.length === 0 ? (
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: rh(8) }}>
              {t('platform.noGamesFound')}
            </Text>
          ) : (
            displayGames.map((game: any, index: number) => (
              <GameCard
                key={game.gameId || game.id || String(index)}
                game={game}
                index={index}
                platformId={platformId}
              />
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

function ConnectView({ platformLogo, platformLabel, usesOAuth, linking, onOAuthLink, onOpenPsnModal }: {
  platformLogo: any;
  platformLabel: string;
  usesOAuth: boolean;
  linking: boolean;
  onOAuthLink: () => void;
  onOpenPsnModal: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.connectContainer}>
      <View style={[styles.connectIconCircle, { backgroundColor: colors.purpleDim }]}>
        {platformLogo
          ? <Image source={platformLogo} style={{ width: rw(60), height: rw(60) }} resizeMode="contain" />
          : <MaterialIcons name="sports-esports" size={rw(56)} color={colors.purple} />}
      </View>
      <Text style={[styles.connectTitle, { color: colors.text }]}>{t('platform.connectTitle', { name: platformLabel })}</Text>
      <Text style={[styles.connectSubtitle, { color: colors.textMuted }]}>{t('platform.connectSubtitle')}</Text>

      {usesOAuth ? (
        <TouchableOpacity
          style={[styles.connectButton, { backgroundColor: colors.purple, opacity: linking ? 0.7 : 1 }]}
          onPress={onOAuthLink}
          disabled={linking}
        >
          {linking
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <MaterialIcons name="open-in-browser" size={rw(18)} color="#fff" />
                <Text style={styles.connectButtonText}>{t('platform.loginWith', { name: platformLabel })}</Text>
              </>}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.connectButton, { backgroundColor: colors.purple }]} onPress={onOpenPsnModal}>
          <MaterialIcons name="link" size={rw(18)} color="#fff" />
          <Text style={styles.connectButtonText}>{t('platform.connect', { name: platformLabel })}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function PsnModal({ visible, linking, platformLabel, onClose, onLink }: {
  visible: boolean;
  linking: boolean;
  platformLabel: string;
  onClose: () => void;
  onLink: (credential: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [credential,  setCredential]  = useState('');
  const [psnHelpOpen, setPsnHelpOpen] = useState(false);

  useEffect(() => {
    if (!visible) { setCredential(''); setPsnHelpOpen(false); }
  }, [visible]);

  const handleClose = () => { setCredential(''); setPsnHelpOpen(false); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('platform.connect', { name: platformLabel })}</Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialIcons name="close" size={rw(22)} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.helpToggle, { borderColor: colors.cardBorder }]}
            onPress={() => setPsnHelpOpen((v) => !v)}
          >
            <MaterialIcons name="help-outline" size={rw(16)} color={colors.purple} />
            <Text style={[styles.helpToggleText, { color: colors.purple }]}>{t('platform.psn.howToGetToken')}</Text>
            <MaterialIcons name={psnHelpOpen ? 'expand-less' : 'expand-more'} size={rw(18)} color={colors.purple} />
          </TouchableOpacity>

          {psnHelpOpen && (
            <View style={[styles.helpBox, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
              <Text style={[styles.helpStep, { color: colors.textMuted }]}>
                {t('platform.psn.step1')}{' '}
                <Text style={{ color: colors.purple }}>my.playstation.com</Text>
              </Text>
              <Text style={[styles.helpStep, { color: colors.textMuted }]}>
                {t('platform.psn.step2')}{'\n'}
                <Text style={{ color: colors.purple, fontSize: rf(11) }}>ca.account.sony.com/api/v1/ssocookie</Text>
              </Text>
              <Text style={[styles.helpStep, { color: colors.textMuted }]}>
                {t('platform.psn.step3')} <Text style={{ fontWeight: '700' }}>{t('platform.psn.step3b')}</Text> {t('platform.psn.step3c')}
              </Text>
              <TouchableOpacity
                style={[styles.helpOpenBtn, { borderColor: colors.purple }]}
                onPress={() => Linking.openURL('https://ca.account.sony.com/api/v1/ssocookie')}
              >
                <MaterialIcons name="open-in-browser" size={rw(14)} color={colors.purple} />
                <Text style={[styles.helpOpenBtnText, { color: colors.purple }]}>{t('platform.psn.openPage')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.modalLabel, { color: colors.textMuted }]}>{t('platform.psn.tokenLabel')}</Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.cardBorder, color: colors.text }]}
            placeholder={t('platform.psn.tokenPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={credential}
            onChangeText={setCredential}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: colors.purple, opacity: (!credential.trim() || linking) ? 0.6 : 1 }]}
            onPress={() => onLink(credential.trim())}
            disabled={!credential.trim() || linking}
          >
            {linking
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.modalButtonText}>{t('platform.psn.link')}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function PlatformGamesScreen() {
  const router       = useRouter();
  const { platform } = useLocalSearchParams<{ platform: string }>();
  const platformId   = normalizePlatformId(platform);
  const { colors }   = useTheme();
  const { t }        = useTranslation();

  const [games,        setGames]        = useState<any[]>([]);
  const [stats,        setStats]        = useState<any>(null);
  const [connected,    setConnected]    = useState(false);
  const [linkedAt,     setLinkedAt]     = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [syncing,      setSyncing]      = useState(false);
  const [linking,      setLinking]      = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const linkingStarted = useRef(false);

  const load = useCallback(async () => {
    if (!platformId) { setLoading(false); return; }
    try {
      const platRes = await platformApi.getLinkedPlatforms();
      const linkedPlatforms: any[] = (platRes.data as any)?.platforms || [];
      const found = linkedPlatforms.find(
        (p: any) => normalizePlatformId(p.platform || p.name) === platformId
      );
      if (found) {
        setConnected(true);
        setLinkedAt(found.linkedAt || null);
        try {
          const [statsRes, gamesRes] = await Promise.all([
            platformApi.getPlatformStats(platformId),
            platformApi.getPlatformGames(platformId),
          ]);
          setStats((statsRes.data as any)?.stats || statsRes.data || null);
          setGames((gamesRes.data as any)?.games || gamesRes.data || []);
        } catch {
          setStats(null); setGames([]);
        }
      } else {
        setConnected(false); setStats(null); setGames([]);
      }
    } catch {
      setConnected(false); setStats(null); setGames([]);
    } finally { setLoading(false); }
  }, [platformId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && linkingStarted.current) {
        linkingStarted.current = false;
        setLoading(true);
        load();
      }
    });
    return () => sub.remove();
  }, [load]);

  useEffect(() => {
    const subscription = ExpoLinking.addEventListener('url', ({ url }) => {
      const parsed        = ExpoLinking.parse(url);
      if (parsed.path !== '--/platform-linked') return;
      const linkedPlat    = parsed.queryParams?.platform as string;
      const success       = parsed.queryParams?.success === 'true';
      if (linkedPlat !== platformId) return;
      if (success) {
        setLoading(true);
        load().finally(() => router.back());
      } else {
        const errMsg = parsed.queryParams?.error as string || t('platform.notConnected');
        Alert.alert(t('common.error'), errMsg);
      }
    });
    return () => subscription.remove();
  }, [platformId, load, t, router]);

  const handleOAuthLink = async () => {
    if (!platformId || !USES_OAUTH[platformId]) return;
    setLinking(true);
    try {
      const redirectUri     = ExpoLinking.createURL('--/platform-linked');
      const res             = await (platformApi as any).initPlatformAuth(platformId, redirectUri);
      const authUrl: string = (res.data as any)?.authUrl;
      if (!authUrl) throw new Error('No auth URL received');
      linkingStarted.current = true;
      if (platformId === 'steam') {
        try { await Linking.openURL(`steam://openurl/${authUrl}`); } catch { await Linking.openURL(authUrl); }
      } else {
        await Linking.openURL(authUrl);
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.response?.data?.error || err?.message || t('common.error'));
    } finally { setLinking(false); }
  };

  const handlePsnLink = async (credential: string) => {
    setLinking(true);
    try {
      await platformApi.linkPlatform('psn', credential);
      setModalVisible(false);
      router.back();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.errors?.[0] || t('common.error');
      Alert.alert(t('common.error'), msg);
    } finally { setLinking(false); }
  };

  const handleSync = async () => {
    if (!platformId || !connected) return;
    setSyncing(true);
    try {
      await platformApi.syncPlatform(platformId);
      setLoading(true);
      await load();
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.response?.data?.error || t('common.error'));
    } finally { setSyncing(false); }
  };

  const handleUnlink = () => {
    if (!platformId) return;
    Alert.alert(
      t('platform.unlink', { name: platformLabel }),
      t('platform.unlinkConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('platform.unlinkConfirm'), style: 'destructive', onPress: async () => {
          try {
            await platformApi.unlinkPlatform(platformId);
            setConnected(false); setStats(null); setGames([]); setLinkedAt(null);
          } catch { Alert.alert(t('common.error'), t('common.error')); }
        }},
      ]
    );
  };

  const platformLogo  = platformId ? PLATFORM_LOGOS[platformId]  : null;
  const platformLabel = platformId ? (PLATFORM_NAME_FULL[platformId] ?? PLATFORM_LABELS[platformId]) : (platform || 'Platform');
  const usesOAuth     = platformId ? USES_OAUTH[platformId] : false;

  const platformContent = connected ? (
    <ConnectedView
      games={games}
      stats={stats}
      linkedAt={linkedAt}
      syncing={syncing}
      platformLabel={platformLabel}
      platformId={platformId}
      onSync={handleSync}
      onUnlink={handleUnlink}
    />
  ) : (
    <ConnectView
      platformLogo={platformLogo}
      platformLabel={platformLabel}
      usesOAuth={usesOAuth}
      linking={linking}
      onOAuthLink={handleOAuthLink}
      onOpenPsnModal={() => setModalVisible(true)}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <PlatformHeader
        platformLogo={platformLogo}
        platformLabel={platformLabel}
        loading={loading}
        connected={connected}
        onBack={() => router.back()}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      ) : platformContent}

      <PsnModal
        visible={modalVisible}
        linking={linking}
        platformLabel={platformLabel}
        onClose={() => setModalVisible(false)}
        onLink={handlePsnLink}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1 },
  header:               { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs.md, paddingVertical: rh(14), borderBottomWidth: 1, gap: rw(14) },
  backButton:           { padding: rw(4) },
  platformInfo:         { flexDirection: 'row', alignItems: 'center', gap: rw(14) },
  platformName:         { fontSize: rf(18), fontWeight: '700' },
  statusRow:            { flexDirection: 'row', alignItems: 'center', gap: rw(6), marginTop: rh(2) },
  statusDot:            { width: rw(8), height: rw(8), borderRadius: rw(4) },
  loadingContainer:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  infoCard:             { borderRadius: rw(14), borderWidth: 1, padding: rw(18), gap: rh(14) },
  infoCardTitle:        { fontSize: rf(16), fontWeight: '700' },
  divider:              { height: 1 },
  infoRow:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel:            { fontSize: rf(14) },
  infoValue:            { fontSize: rf(14) },
  searchContainer:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: rw(10), paddingHorizontal: rw(12), paddingVertical: rh(8), gap: rw(8) },
  searchInput:          { flex: 1, fontSize: rf(14), paddingVertical: 0 },
  sortRow:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortGroup:            { flexDirection: 'row', gap: rw(8) },
  sortChip:             { paddingHorizontal: rw(14), paddingVertical: rh(7), borderRadius: rw(20) },
  sortDirBtn:           { padding: rw(8), borderRadius: rw(8), borderWidth: 1 },
  sectionTitle:         { fontSize: rf(16), fontWeight: '600' },
  gameRow:              { flexDirection: 'row', alignItems: 'center', borderRadius: rw(12), borderWidth: 1, overflow: 'hidden' },
  gameCoverWrapper:     { position: 'relative' },
  gameCover:            { width: rw(70), height: rw(70) },
  gameCoverPlaceholder: { width: rw(70), height: rw(70), alignItems: 'center', justifyContent: 'center' },
  trophyBadge:          { position: 'absolute', top: rw(5), right: rw(5), backgroundColor: '#F59E0B', padding: rw(4), borderRadius: rw(6), zIndex: 1 },
  gameInfo:             { flex: 1, padding: rw(12) },
  gameName:             { fontSize: rf(14), fontWeight: '600' },
  progressBar:          { height: rh(4), borderRadius: 2, overflow: 'hidden' },
  progressFill:         { height: '100%', borderRadius: 2 },
  unlinkButton:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rw(8), padding: rh(14), borderRadius: rw(12), borderWidth: 1, marginTop: rh(8), marginBottom: rh(24) },
  unlinkText:           { color: '#EF4444', fontWeight: '600', fontSize: rf(15) },
  syncButton:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rw(8), padding: rh(14), borderRadius: rw(12), marginBottom: rh(24) },
  syncButtonText:       { color: '#fff', fontWeight: '600', fontSize: rf(15) },
  connectContainer:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: rw(32), gap: rh(20) },
  connectIconCircle:    { width: rw(110), height: rw(110), borderRadius: rw(55), alignItems: 'center', justifyContent: 'center' },
  connectTitle:         { fontSize: rf(20), fontWeight: '700', textAlign: 'center' },
  connectSubtitle:      { fontSize: rf(14), textAlign: 'center', lineHeight: rh(22) },
  connectButton:        { flexDirection: 'row', alignItems: 'center', gap: rw(8), paddingHorizontal: rw(28), paddingVertical: rh(14), borderRadius: rw(12) },
  connectButtonText:    { color: '#fff', fontWeight: '700', fontSize: rf(15) },
  modalOverlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent:         { borderTopLeftRadius: rw(20), borderTopRightRadius: rw(20), borderWidth: 1, padding: rw(24), gap: rh(14) },
  modalHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle:           { fontSize: rf(18), fontWeight: '700' },
  modalLabel:           { fontSize: rf(13), fontWeight: '500' },
  modalInput:           { borderWidth: 1, borderRadius: rw(10), paddingHorizontal: rw(14), paddingVertical: rh(12), fontSize: rf(14) },
  modalButton:          { borderRadius: rw(12), paddingVertical: rh(14), alignItems: 'center' },
  modalButtonText:      { color: '#fff', fontWeight: '700', fontSize: rf(15) },
  helpToggle:           { flexDirection: 'row', alignItems: 'center', gap: rw(6), paddingVertical: rh(8), paddingHorizontal: rw(12), borderWidth: 1, borderRadius: rw(8) },
  helpToggleText:       { flex: 1, fontSize: rf(13), fontWeight: '600' },
  helpBox:              { borderWidth: 1, borderRadius: rw(8), padding: rw(14), gap: rh(8) },
  helpStep:             { fontSize: rf(13), lineHeight: rh(20) },
  helpOpenBtn:          { flexDirection: 'row', alignItems: 'center', gap: rw(6), paddingVertical: rh(8), paddingHorizontal: rw(12), borderWidth: 1, borderRadius: rw(8), alignSelf: 'flex-start', marginTop: rh(4) },
  helpOpenBtnText:      { fontSize: rf(13), fontWeight: '600' },
});
