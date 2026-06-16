import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, ActivityIndicator,
  RefreshControl, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { userApi, friendApi } from '@/services/api';
import { rw, rh, rf, rs, cardWidth, gridColumns } from '@/utils/responsive';
import { ProfileHeader, GameCard } from '@/components';
import { normalizeAvatarId } from '@/constants/avatars';
import { getProfileAvatar } from '@/services/mockData';

const COLS       = gridColumns();
const CARD_W     = cardWidth(COLS);
const FAV_CARD_W = cardWidth(Math.min(COLS + 1, 3));

function resolveCover(platform: string, gameId: string, stored?: string | null): string {
  if (stored) return stored;
  if (platform?.toLowerCase() === 'steam') return `https://cdn.akamai.steamstatic.com/steam/apps/${gameId}/header.jpg`;
  return '';
}

interface ProfileGame {
  gameId: string;
  name: string;
  platform: string;
  cover: string | null;
  playtimeHours: number;
}

interface FavGame {
  gameId: string;
  name: string;
  platform: string;
  cover?: string | null;
  playtimeHours?: number;
}

interface UserProfile {
  uid: string;
  username: string;
  bio: string;
  avatarId: string | null;
  favoriteGames: FavGame[];
  platforms: { platform: string }[];
}

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const [profile, setProfile]           = useState<UserProfile | null>(null);
  const [profileGames, setProfileGames] = useState<ProfileGame[]>([]);
  const [achievementCounts, setAchievementCounts] = useState<Record<string, { total: number; completed: number }>>({});
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [isFriend, setIsFriend]         = useState(false);
  const [pendingSent, setPendingSent]   = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwn = userId === currentUser?.id;

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [profileRes, gamesRes, friendsRes] = await Promise.allSettled([
        userApi.getProfile(userId),
        userApi.getProfileGames(userId),
        friendApi.getFriends(),
      ]);

      let favGames: FavGame[] = [];

      if (profileRes.status === 'fulfilled') {
        const d = (profileRes.value.data as any)?.profile ?? (profileRes.value.data as any);
        favGames = d.favoriteGames || [];
        setProfile({
          uid:           d.uid || d.id || userId,
          username:      d.username || d.name || d.displayName || userId,
          bio:           d.bio || '',
          avatarId:      normalizeAvatarId(d.avatarId || d.avatar, d.uid || d.id || userId),
          favoriteGames: favGames,
          platforms:     d.platforms || [],
        });
      }

      if (gamesRes.status === 'fulfilled') {
        const data = gamesRes.value.data as any;
        const games: ProfileGame[] = data?.profileGames || data || [];
        setProfileGames(games);

        // Fetch achievements for profile games + favorites, deduped by platform+gameId
        const seen = new Set<string>();
        const allToFetch = [
          ...games.map((g) => ({ platform: g.platform, gameId: g.gameId })),
          ...favGames.map((g) => ({ platform: g.platform, gameId: g.gameId })),
        ].filter(({ platform, gameId }) => {
          const key = `${platform}_${gameId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        allToFetch.forEach(({ platform, gameId }) => {
          userApi.getUserGameAchievements(userId, platform, gameId)
            .then((achRes) => {
              const achievements: any[] = (achRes.data as any)?.achievements || [];
              setAchievementCounts((prev) => ({
                ...prev,
                [`${platform}_${gameId}`]: {
                  total:     achievements.length,
                  completed: achievements.filter((a) => a.unlocked).length,
                },
              }));
            })
            .catch(() => {});
        });
      }

      if (friendsRes.status === 'fulfilled') {
        const friends: any[] = (friendsRes.value.data as any)?.friends || [];
        setIsFriend(friends.some((f: any) => (f.uid || f.id) === userId));
      }
    } catch {}
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    setAchievementCounts({});
    await loadData();
    setRefreshing(false);
  };

  const handleFriendAction = async () => {
    if (!userId || pendingSent || isFriend) return;
    setActionLoading(true);
    try {
      await friendApi.sendFriendRequest(userId);
      setPendingSent(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'No se pudo enviar la solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={rw(24)} color={colors.purple} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('userProfile.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const platformNames = profile.platforms.map((p) => p.platform);
  const friendButtonLabel = isFriend ? t('social.friends') : pendingSent ? t('social.actions.pending') : t('userProfile.addFriend');
  const totalHours = profileGames.reduce((acc, g) => acc + (g.playtimeHours || 0), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Barra superior ── */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={rw(24)} color={colors.purple} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {profile.username}
        </Text>
        {!isOwn && (
          <TouchableOpacity
            style={[
              styles.friendBtn,
              {
                backgroundColor: isFriend ? colors.purpleMuted : pendingSent ? colors.card : colors.purple,
                borderColor: isFriend ? colors.purpleBorder : pendingSent ? colors.border : colors.purple,
              },
            ]}
            onPress={handleFriendAction}
            disabled={isFriend || pendingSent || actionLoading}
          >
            {actionLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <MaterialIcons
                  name={isFriend ? 'check' : pendingSent ? 'schedule' : 'person-add'}
                  size={rw(16)}
                  color={isFriend || pendingSent ? colors.textMuted : '#fff'}
                />}
            <Text style={[styles.friendBtnText, { color: isFriend || pendingSent ? colors.textMuted : '#fff' }]}>
              {friendButtonLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          name={profile.username}
          avatar={profile.avatarId || getProfileAvatar(profile.uid)}
          bio={profile.bio}
          stats={[
            { icon: 'sports-esports', iconColor: colors.purple, value: profileGames.length,                    label: t('profile.gamesLabel') },
            { icon: 'schedule',       iconColor: '#60A5FA',      value: totalHours ? `${totalHours}h` : '—', label: t('profile.hoursLabel') },
          ]}
          platforms={platformNames}
          onSync={onRefresh}
          syncing={refreshing}
        />

        {/* ── Favoritos (horizontal FlatList, igual que perfil propio) ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="star-outline" size={rw(17)} color="#F59E0B" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('profile.favorites')}{profile.favoriteGames.length > 0 ? ` (${profile.favoriteGames.length})` : ''}
              </Text>
            </View>
          </View>
          {profile.favoriteGames.length > 0 ? (
            <FlatList
              data={profile.favoriteGames}
              horizontal
              keyExtractor={(item) => `${item.platform}_${item.gameId}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: rs.md, gap: rw(12) }}
              renderItem={({ item }) => {
                const achKey = `${item.platform}_${item.gameId}`;
                const ach = achievementCounts[achKey];
                const pg    = profileGames.find((g) => g.gameId === item.gameId && g.platform === item.platform);
                const hours = item.playtimeHours || pg?.playtimeHours || 0;
                return (
                  <GameCard
                    id={item.gameId}
                    name={item.name}
                    cover={resolveCover(item.platform, item.gameId, item.cover)}
                    totalHours={hours}
                    totalAchievements={ach?.total ?? 0}
                    completedAchievements={ach?.completed ?? 0}
                    platform={item.platform}
                    width={FAV_CARD_W}
                    skillLevel={null}
                    onPress={() => router.push(
                      `/game/${item.gameId}?platform=${item.platform}&userId=${userId}&name=${encodeURIComponent(item.name)}&cover=${encodeURIComponent(resolveCover(item.platform, item.gameId, item.cover))}&totalHours=${hours}`
                    )}
                  />
                );
              }}
            />
          ) : (
            <View style={[styles.emptyFavs, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialIcons name="star-outline" size={rw(28)} color={colors.textMuted} />
              <Text style={[styles.emptyFavsText, { color: colors.textMuted }]}>{t('userProfile.noFavorites')}</Text>
            </View>
          )}
        </View>

        {/* ── Juegos del perfil ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="sports-esports" size={rw(17)} color={colors.purple} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('profile.gamesLabel')}{profileGames.length > 0 ? ` (${profileGames.length})` : ''}
              </Text>
            </View>
          </View>
          {profileGames.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.purpleMuted }]}>
                <MaterialIcons name="videogame-asset-off" size={rw(40)} color={colors.purple} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('userProfile.noGames')}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>{t('userProfile.noGamesSubtitle')}</Text>
            </View>
          ) : (
            <View style={[styles.grid, { paddingHorizontal: rs.md, gap: rw(12) }]}>
              {profileGames.map((pg) => {
                const achKey = `${pg.platform}_${pg.gameId}`;
                const ach = achievementCounts[achKey];
                return (
                  <GameCard
                    key={achKey}
                    id={pg.gameId}
                    name={pg.name}
                    cover={resolveCover(pg.platform, pg.gameId, pg.cover)}
                    totalHours={pg.playtimeHours}
                    totalAchievements={ach?.total ?? 0}
                    completedAchievements={ach?.completed ?? 0}
                    platform={pg.platform}
                    width={CARD_W}
                    skillLevel={null}
                    onPress={() => router.push(
                      `/game/${pg.gameId}?platform=${pg.platform}&userId=${userId}&name=${encodeURIComponent(pg.name)}&cover=${encodeURIComponent(resolveCover(pg.platform, pg.gameId, pg.cover))}&totalHours=${pg.playtimeHours}`
                    )}
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  centered:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs.md, paddingVertical: rh(12), borderBottomWidth: 1, gap: rw(12) },
  backBtn:         { padding: rw(4) },
  headerTitle:     { flex: 1, fontSize: rf(17), fontWeight: '700' },
  friendBtn:       { flexDirection: 'row', alignItems: 'center', gap: rw(5), paddingHorizontal: rw(12), paddingVertical: rh(7), borderRadius: rw(20), borderWidth: 1 },
  friendBtnText:   { fontSize: rf(13), fontWeight: '600' },
  section:         { marginBottom: rh(24) },
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: rs.md, marginBottom: rh(12) },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: rw(6) },
  sectionTitle:    { fontSize: rf(15), fontWeight: '700' },
  grid:            { flexDirection: 'row', flexWrap: 'wrap' },
  emptyFavs:       { marginHorizontal: rs.md, borderRadius: rw(14), borderWidth: 1, paddingVertical: rh(20), alignItems: 'center', gap: rh(8), flexDirection: 'row', justifyContent: 'center' },
  emptyFavsText:   { fontSize: rf(13) },
  emptyState:      { margin: rs.md, borderRadius: rw(20), borderWidth: 1, padding: rw(28), alignItems: 'center', gap: rh(12) },
  emptyIcon:       { width: rw(80), height: rw(80), borderRadius: rw(40), alignItems: 'center', justifyContent: 'center', marginBottom: rh(4) },
  emptyTitle:      { fontSize: rf(18), fontWeight: '700', textAlign: 'center' },
  emptySubtitle:   { fontSize: rf(14), textAlign: 'center', lineHeight: rh(20) },
  emptyText:       { fontSize: rf(14), textAlign: 'center' },
});
