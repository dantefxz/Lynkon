import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, ActivityIndicator,
  RefreshControl, StyleSheet, TouchableOpacity, Alert,
  Modal, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { platformApi, userApi } from '@/services/api';
import { rw, rh, rf, rs, gridColumns, cardWidth } from '@/utils/responsive';
import { GameCard, ProfileHeader } from '@/components';
import { AddGameModal } from '@/components/AddGameModal';
import { EditFavoritesModal } from '@/components/EditFavoritesModal';
import { SkillLevel } from '@/utils/skillStorage';

interface Game {
  id: string;
  name: string;
  cover: string;
  totalHours: number;
  totalAchievements: number;
  completedAchievements: number;
  platform?: string;
  platforms: { name: string; hours: number; achievements: number; completedAchievements: number }[];
}

interface ProfileGame {
  gameId: string;
  name: string;
  platform: string;
  cover: string | null;
  playtimeHours: number;
}

const COLS       = gridColumns();
const CARD_W     = cardWidth(COLS);
const FAV_CARD_W = cardWidth(Math.min(COLS + 1, 3));

// ── Sub-components (independent cognitive complexity) ──────────────────────────

function FavoritesSection({ favoriteGames, achievementCounts, skillLevels, onAddFav, onEditFav }: {
  favoriteGames: Game[];
  achievementCounts: Record<string, { total: number; completed: number }>;
  skillLevels: Record<string, SkillLevel>;
  onAddFav: () => void;
  onEditFav: () => void;
}) {
  const { colors } = useTheme();
  const { t }      = useTranslation();
  const router     = useRouter();
  const titleCount = favoriteGames.length > 0 ? ` (${favoriteGames.length})` : '';

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="star-outline" size={rw(17)} color="#F59E0B" />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('profile.myFavorites')}{titleCount}
          </Text>
        </View>
        <View style={styles.sectionActions}>
          <TouchableOpacity
            style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.purpleMuted }]}
            onPress={onAddFav}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={rw(14)} color={colors.text} />
            <Text style={[styles.pillText, { color: colors.text }]}>{t('profile.add')}</Text>
          </TouchableOpacity>
          {favoriteGames.length > 0 && (
            <TouchableOpacity
              style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.purpleMuted }]}
              onPress={onEditFav}
              activeOpacity={0.8}
            >
              <MaterialIcons name="edit" size={rw(13)} color={colors.text} />
              <Text style={[styles.pillText, { color: colors.text }]}>{t('profile.edit')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {favoriteGames.length > 0 ? (
        <FlatList
          data={favoriteGames}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: rs.md, gap: rw(12) }}
          renderItem={({ item }) => {
            const ach = achievementCounts[`${item.platform}_${item.id}`];
            return (
              <GameCard
                {...item}
                totalAchievements={ach?.total ?? item.totalAchievements}
                completedAchievements={ach?.completed ?? item.completedAchievements}
                width={FAV_CARD_W}
                skillLevel={skillLevels[item.id] ?? null}
                onPress={() => router.push(`/game/${item.id}`)}
              />
            );
          }}
        />
      ) : (
        <View style={[styles.emptyFavs, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialIcons name="star-outline" size={rw(28)} color={colors.textMuted} />
          <Text style={[styles.emptyFavsText, { color: colors.textMuted }]}>{t('profile.noFavoritesHint')}</Text>
        </View>
      )}
    </View>
  );
}

function GamesSection({ profileGames, platforms, achievementCounts, skillLevels, syncing, onSync, onAdd, onRemove }: {
  profileGames: ProfileGame[];
  platforms: string[];
  achievementCounts: Record<string, { total: number; completed: number }>;
  skillLevels: Record<string, SkillLevel>;
  syncing: boolean;
  onSync: () => void;
  onAdd: () => void;
  onRemove: (gameId: string, platform: string) => void;
}) {
  const { colors } = useTheme();
  const { t }      = useTranslation();
  const router     = useRouter();
  const titleCount = profileGames.length > 0 ? ` (${profileGames.length})` : '';
  const emptyTitle = platforms.length === 0 ? t('profile.noGamesTitle')      : t('profile.addGamesTitle');
  const emptyHint  = platforms.length === 0 ? t('profile.linkPlatformHint')  : t('profile.addGamesHint');

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="sports-esports" size={rw(17)} color={colors.purple} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('profile.myGames')}{titleCount}
          </Text>
        </View>
        {platforms.length > 0 && (
          <View style={styles.sectionActions}>
            <TouchableOpacity
              style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.purpleMuted }]}
              onPress={onSync}
              activeOpacity={0.8}
              disabled={syncing}
            >
              {syncing
                ? <ActivityIndicator size="small" color={colors.purple} />
                : <MaterialIcons name="refresh" size={rw(14)} color={colors.text} />}
              <Text style={[styles.pillText, { color: colors.text }]}>{t('profile.reload')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.purpleMuted }]}
              onPress={onAdd}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={rw(14)} color={colors.text} />
              <Text style={[styles.pillText, { color: colors.text }]}>{t('common.add')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {profileGames.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.purpleMuted }]}>
            <MaterialIcons name="videogame-asset-off" size={rw(40)} color={colors.purple} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{emptyTitle}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>{emptyHint}</Text>
          {platforms.length === 0 && (
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.purple }]}
              onPress={() => router.push('/tabs/settings')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="link" size={rw(16)} color={colors.text} />
              <Text style={[styles.emptyBtnText, { color: colors.text }]}>{t('profile.linkPlatform')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={[styles.grid, { paddingHorizontal: rs.md, gap: rw(12) }]}>
          {profileGames.map((pg) => {
            const achKey = `${pg.platform}_${pg.gameId}`;
            const ach    = achievementCounts[achKey];
            return (
              <GameCard
                key={achKey}
                id={pg.gameId}
                name={pg.name}
                cover={pg.cover || ''}
                totalHours={pg.playtimeHours}
                totalAchievements={ach?.total ?? 0}
                completedAchievements={ach?.completed ?? 0}
                platform={pg.platform}
                width={CARD_W}
                skillLevel={skillLevels[pg.gameId] ?? null}
                onPress={() => router.push(`/game/${pg.gameId}?platform=${pg.platform}`)}
                onRemove={() => onRemove(pg.gameId, pg.platform)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router     = useRouter();
  const { user, updateUserName, updateUserBio } = useAuth();
  const { colors } = useTheme();
  const { t }      = useTranslation();

  // All games fetched from platforms (for search/add modal)
  const [allGames, setAllGames]           = useState<Game[]>([]);
  const [platforms, setPlatforms]         = useState<string[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [syncing, setSyncing]             = useState(false);

  // Profile games — curated by the user
  const [profileGames, setProfileGames]   = useState<ProfileGame[]>([]);

  // Favorites
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);

  const [achievementCounts, setAchievementCounts] = useState<Record<string, { total: number; completed: number }>>({});

  const [skillLevels, setSkillLevels] = useState<Record<string, SkillLevel>>({});
  const [addProfileModalVisible, setAddProfileModalVisible] = useState(false);
  const [addFavModalVisible, setAddFavModalVisible]         = useState(false);
  const [editModalVisible, setEditModalVisible]             = useState(false);

  // ── Edición inline de nombre y bio ────────────────────────────────────────────
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editName, setEditName]                     = useState('');
  const [editBio, setEditBio]                       = useState('');
  const [editSaving, setEditSaving]                 = useState(false);

  const openEditProfile = () => {
    setEditName(user?.name || '');
    setEditBio(user?.bio || '');
    setEditProfileVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setEditSaving(true);
    try {
      await userApi.updateProfile(user.id, { username: editName, bio: editBio });
      updateUserName(editName);
      updateUserBio(editBio);
      setEditProfileVisible(false);
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.response?.data?.error || t('editProfile.saveError'));
    } finally {
      setEditSaving(false);
    }
  };

  // ── Carga principal ────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. Plataformas vinculadas
      const platRes = await platformApi.getLinkedPlatforms();
      const linked: string[] = ((platRes.data as any)?.platforms || []).map(
        (p: any) => p.platform || p.name,
      );
      setPlatforms(linked);

      // 2. Juegos de todas las plataformas (para el modal de búsqueda)
      const fetched: Game[] = [];
      for (const plat of linked) {
        try {
          const gRes = await platformApi.getPlatformGames(plat);
          const serverGames: Game[] = ((gRes.data as any)?.games || gRes.data || []).map(
            (g: any, i: number) => ({
              id:                    String(g.gameId || g.id || `${plat}_${i}`),
              name:                  g.name || g.title || 'Unknown',
              cover:                 g.cover || g.imageUrl || g.iconUrl || '',
              totalHours:            g.playtimeHours || g.totalHours || g.playtime || 0,
              totalAchievements:     g.totalAchievements || 0,
              completedAchievements: g.completedAchievements || 0,
              platform:              plat,
              platforms: [{ name: plat, hours: g.playtimeHours || g.totalHours || 0, achievements: g.totalAchievements || 0, completedAchievements: g.completedAchievements || 0 }],
            }),
          );
          fetched.push(...serverGames);
        } catch {}
      }
      setAllGames(fetched);

      // 3. Juegos del perfil (curados)
      try {
        const pgRes = await userApi.getProfileGames(user.id);
        setProfileGames((pgRes.data as any)?.profileGames || []);
      } catch {}

      // 5. Skill tags desde Firestore (fuente de verdad)
      try {
        const profileRes = await userApi.getMyProfile();
        const tags: Record<string, SkillLevel> = (profileRes.data as any)?.profile?.skillTags || {};
        setSkillLevels(tags);
      } catch {}

      // 4. Favoritos
      try {
        const favRes = await userApi.getFavorites(user.id);
        const favList: any[] = (favRes.data as any)?.favoriteGames || favRes.data || [];
        const favGames = favList
          .map((f: any) => fetched.find((g) => g.id === f.gameId))
          .filter(Boolean) as Game[];
        setFavoriteGames(favGames);
      } catch {}
    } catch {
      setAllGames([]);
      setPlatforms([]);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  // Recargar skill tags al volver al tab (ej: después de setear uno en [gameId].tsx)
  useFocusEffect(
    useCallback(() => {
      if (!loading) loadData();
    }, [loadData]),
  );

  // Fetch achievement counts for profile + favorite games in background
  useEffect(() => {
    const games = [
      ...profileGames.map((pg) => ({ platform: pg.platform, gameId: pg.gameId })),
      ...favoriteGames.map((fg) => ({ platform: fg.platform || '', gameId: fg.id })),
    ].filter((g, i, arr) =>
      g.platform && arr.findIndex((x) => x.platform === g.platform && x.gameId === g.gameId) === i
    );

    games.forEach(async ({ platform, gameId }) => {
      try {
        const achRes = await platformApi.getGameAchievements(platform, gameId);
        const achievements: any[] = (achRes.data as any)?.achievements || [];
        const completed = achievements.filter((a: any) => a.unlocked).length;
        setAchievementCounts((prev) => ({
          ...prev,
          [`${platform}_${gameId}`]: { total: achievements.length, completed },
        }));
      } catch {}
    });
  }, [profileGames.length, favoriteGames.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await Promise.all(platforms.map((platform) => platformApi.syncPlatform(platform)));
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'No se pudo sincronizar las plataformas');
    } finally {
      setSyncing(false);
    }
  };

  // ── Favoritos ──────────────────────────────────────────────────────────────
  const handleAddFavorite = async (game: Game) => {
    if (!user?.id) return;
    try {
      await userApi.addFavorite(user.id, game.id, game.name, game.platform || 'steam', game.cover, game.totalHours);
      setFavoriteGames((prev) => (prev.find((g) => g.id === game.id) ? prev : [...prev, game]));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'No se pudo agregar a favoritos');
    }
  };

  const handleRemoveFavorite = async (gameId: string) => {
    if (!user?.id) return;
    const game = allGames.find((g) => g.id === gameId);
    try {
      await userApi.removeFavorite(user.id, gameId, game?.platform);
      setFavoriteGames((prev) => prev.filter((g) => g.id !== gameId));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'No se pudo eliminar de favoritos');
    }
  };

  const handleReorderFavorites = (reordered: any[]) => setFavoriteGames(reordered as Game[]);

  // ── Juegos del perfil ──────────────────────────────────────────────────────
  const profileGameIds = new Set(profileGames.map((g) => `${g.platform}_${g.gameId}`));

  const handleToggleProfileGame = async (id: string) => {
    if (!user?.id) return;
    const game = allGames.find((g) => g.id === id);
    if (!game) return;
    const key = `${game.platform}_${game.id}`;
    const isInProfile = profileGameIds.has(key);
    try {
      if (isInProfile) {
        await userApi.removeProfileGame(user.id, game.id, game.platform);
        setProfileGames((prev) => prev.filter((g) => !(g.gameId === game.id && g.platform === game.platform)));
      } else {
        await userApi.addProfileGame(user.id, game.id, game.name, game.platform || 'steam', game.cover, game.totalHours);
        setProfileGames((prev) => [...prev, {
          gameId: game.id,
          name: game.name,
          platform: game.platform || 'steam',
          cover: game.cover,
          playtimeHours: game.totalHours,
        }]);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'No se pudo actualizar el perfil');
    }
  };

  const handleRemoveProfileGame = async (gameId: string, platform: string) => {
    if (!user?.id) return;
    try {
      await userApi.removeProfileGame(user.id, gameId, platform);
      setProfileGames((prev) => prev.filter((g) => !(g.gameId === gameId && g.platform === platform)));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'No se pudo eliminar del perfil');
    }
  };

  const totalHours = profileGames.reduce((acc, g) => acc + (g.playtimeHours || 0), 0);
  const totalGames = profileGames.length;

  // Set de IDs de juegos en el perfil (para el modal — usa el mismo key de allGames)
  const profileIdsForModal = new Set(
    allGames
      .filter((g) => profileGameIds.has(`${g.platform}_${g.id}`))
      .map((g) => g.id)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          name={user?.name || 'Gamer'}
          avatar={user?.avatar}
          bio={user?.bio}
          onEditBio={openEditProfile}
          onEditAvatar={() => router.push('/settings/edit-profile')}
          stats={[
            { icon: 'sports-esports', iconColor: colors.purple, value: totalGames,        label: t('profile.gamesLabel') },
            { icon: 'schedule',       iconColor: '#60A5FA',      value: `${totalHours}h`, label: t('profile.hoursLabel')  },
          ]}
          platforms={platforms}
          onSync={handleSync}
          syncing={syncing}
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.purple} />
          </View>
        ) : (
          <>
            <FavoritesSection
              favoriteGames={favoriteGames}
              achievementCounts={achievementCounts}
              skillLevels={skillLevels}
              onAddFav={() => setAddFavModalVisible(true)}
              onEditFav={() => setEditModalVisible(true)}
            />
            <GamesSection
              profileGames={profileGames}
              platforms={platforms}
              achievementCounts={achievementCounts}
              skillLevels={skillLevels}
              syncing={syncing}
              onSync={handleSync}
              onAdd={() => setAddProfileModalVisible(true)}
              onRemove={handleRemoveProfileGame}
            />
          </>
        )}
      </ScrollView>

      {/* Modal para juegos del perfil */}
      <AddGameModal
        visible={addProfileModalVisible}
        platforms={platforms}
        allGames={allGames}
        visibleIds={profileIdsForModal}
        onToggle={handleToggleProfileGame}
        onClose={() => setAddProfileModalVisible(false)}
      />

      {/* Modal para favoritos */}
      <AddGameModal
        visible={addFavModalVisible}
        title={t('profile.addFavorite')}
        platforms={platforms}
        allGames={allGames}
        visibleIds={new Set(favoriteGames.map((g) => g.id))}
        onToggle={(id) => {
          const game = allGames.find((g) => g.id === id);
          if (!game) return;
          if (favoriteGames.some((g) => g.id === id)) handleRemoveFavorite(id);
          else handleAddFavorite(game);
        }}
        onClose={() => setAddFavModalVisible(false)}
      />

      <EditFavoritesModal
        visible={editModalVisible}
        favorites={favoriteGames}
        onReorder={handleReorderFavorites}
        onRemove={handleRemoveFavorite}
        onClose={() => setEditModalVisible(false)}
      />

      {/* ── Modal editar nombre y bio ── */}
      <Modal
        visible={editProfileVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <View style={styles.epOverlay}>
          <View style={[styles.epModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.epHeader}>
              <Text style={[styles.epTitle, { color: colors.text }]}>{t('editProfile.title')}</Text>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                <MaterialIcons name="close" size={rw(22)} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.epLabel, { color: colors.purple }]}>{t('editProfile.username')}</Text>
            <View style={[styles.epInputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <MaterialIcons name="person-outline" size={rw(17)} color={colors.textMuted} />
              <TextInput
                style={[styles.epInput, { color: colors.text }]}
                value={editName}
                onChangeText={setEditName}
                placeholder={t('editProfile.usernamePlaceholder')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={[styles.epLabel, { color: colors.purple }]}>{t('editProfile.bio')}</Text>
            <View style={[styles.epBioBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                style={[styles.epBioInput, { color: colors.text }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder={t('editProfile.bioHint')}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
                autoCorrect={false}
              />
            </View>
            <Text style={[styles.epCharCount, { color: colors.textMuted }]}>{editBio.length}/200</Text>

            <TouchableOpacity
              style={[styles.epSaveBtn, { backgroundColor: colors.purple, opacity: editSaving ? 0.7 : 1 }]}
              onPress={handleSaveProfile}
              disabled={editSaving}
            >
              {editSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.epSaveBtnText}>{t('common.save')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  loading:         { height: rh(200), alignItems: 'center', justifyContent: 'center' },
  section:         { marginBottom: rh(24) },
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: rs.md, marginBottom: rh(12) },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: rw(6) },
  sectionTitle:    { fontSize: rf(15), fontWeight: '700' },
  sectionActions:  { flexDirection: 'row', gap: rw(8) },
  pill:            { flexDirection: 'row', alignItems: 'center', gap: rw(4), paddingHorizontal: rw(10), paddingVertical: rh(5), borderRadius: rw(20), borderWidth: 1 },
  pillText:        { fontSize: rf(12), fontWeight: '600' },
  emptyFavs:       { marginHorizontal: rs.md, borderRadius: rw(14), borderWidth: 1, paddingVertical: rh(20), alignItems: 'center', gap: rh(8), flexDirection: 'row', justifyContent: 'center' },
  emptyFavsText:   { fontSize: rf(13) },
  grid:            { flexDirection: 'row', flexWrap: 'wrap' },
  emptyState:      { margin: rs.md, borderRadius: rw(20), borderWidth: 1, padding: rw(28), alignItems: 'center', gap: rh(12) },
  emptyIcon:       { width: rw(80), height: rw(80), borderRadius: rw(40), alignItems: 'center', justifyContent: 'center', marginBottom: rh(4) },
  emptyTitle:      { fontSize: rf(18), fontWeight: '700', textAlign: 'center' },
  emptySubtitle:   { fontSize: rf(14), textAlign: 'center', lineHeight: rh(20) },
  emptyBtn:        { flexDirection: 'row', alignItems: 'center', gap: rw(6), marginTop: rh(8), paddingHorizontal: rw(20), paddingVertical: rh(12), borderRadius: rw(12) },
  emptyBtnText:    { fontSize: rf(14), fontWeight: '600' },
  // Edit profile modal
  epOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  epModal:         { width: '88%', borderRadius: rw(20), borderWidth: 1, padding: rw(22), gap: rh(12) },
  epHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: rh(4) },
  epTitle:         { fontSize: rf(17), fontWeight: '700' },
  epLabel:         { fontSize: rf(12), fontWeight: '600' },
  epInputRow:      { flexDirection: 'row', alignItems: 'center', gap: rw(10), borderRadius: rw(10), borderWidth: 1, paddingHorizontal: rw(12), paddingVertical: rh(2) },
  epInput:         { flex: 1, fontSize: rf(15), paddingVertical: rh(10) },
  epBioBox:        { borderRadius: rw(10), borderWidth: 1, paddingHorizontal: rw(12), paddingVertical: rh(8) },
  epBioInput:      { fontSize: rf(14), minHeight: rh(70) },
  epCharCount:     { fontSize: rf(11), textAlign: 'right', marginTop: -rh(6) },
  epSaveBtn:       { borderRadius: rw(12), paddingVertical: rh(14), alignItems: 'center', marginTop: rh(4) },
  epSaveBtnText:   { color: '#fff', fontSize: rf(15), fontWeight: '600' },
});
