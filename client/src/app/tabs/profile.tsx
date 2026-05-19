import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, ActivityIndicator,
  RefreshControl, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { platformApi } from '@/services/api';
import { rw, rh, rf, rs, gridColumns, cardWidth } from '@/utils/responsive';
import { GameCard, ProfileHeader } from '@/components';
import { AddGameModal } from '@/components/AddGameModal';
import { EditFavoritesModal } from '@/components/EditFavoritesModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Game {
  id: string;
  name: string;
  cover: string;
  rank: number;
  totalHours: number;
  totalAchievements: number;
  completedAchievements: number;
  isFavorite?: boolean;
  favoriteRank?: number;
  platforms: {
    name: string;
    hours: number;
    achievements: number;
    completedAchievements: number;
  }[];
}

const VISIBLE_STORAGE_KEY = 'profile_visible_game_ids';
const FAVORITES_STORAGE_KEY = 'profile_favorite_game_ids';

const COLS = gridColumns();
const CARD_W = cardWidth(COLS);
const FAV_CARD_W = cardWidth(Math.min(COLS + 1, 3));

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [allGames, setAllGames] = useState<Game[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const loadPersistedState = async () => {
    try {
      const [storedVisible, storedFavs] = await Promise.all([
        AsyncStorage.getItem(VISIBLE_STORAGE_KEY),
        AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
      ]);
      if (storedVisible) setVisibleIds(new Set(JSON.parse(storedVisible)));
      return storedFavs ? JSON.parse(storedFavs) as string[] : null;
    } catch { return null; }
  };

  const persistVisibleIds = async (ids: Set<string>) => {
    try { await AsyncStorage.setItem(VISIBLE_STORAGE_KEY, JSON.stringify([...ids])); } catch {}
  };

  const persistFavoriteIds = async (games: Game[]) => {
    try { await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(games.map((g) => g.id))); } catch {}
  };

  const loadData = useCallback(async () => {
    try {
      const platRes = await platformApi.getLinkedPlatforms();
      const linked: string[] = (((platRes.data as any)?.platforms) || []).map((p: any) => p.platform || p.name);
      setPlatforms(linked);

      const fetched: Game[] = [];
      for (const plat of linked) {
        try {
          const gRes = await platformApi.getPlatformGames(plat);
          const serverGames: Game[] = (gRes.data || []).map((g: any, i: number) => ({
            id: g.id || `${plat}_${i}`,
            name: g.name || g.title || 'Unknown',
            cover: g.cover || g.imageUrl || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop',
            rank: i + 1,
            totalHours: g.totalHours || g.playtime || 0,
            totalAchievements: g.totalAchievements || 100,
            completedAchievements: g.completedAchievements || 0,
            platforms: [{ name: plat, hours: g.totalHours || 0, achievements: g.totalAchievements || 100, completedAchievements: g.completedAchievements || 0 }],
          }));
          fetched.push(...serverGames);
        } catch {}
      }
      setAllGames(fetched);

      const savedFavIds = await loadPersistedState();
      if (savedFavIds) {
        const favs = savedFavIds
          .map((id: string) => fetched.find((g) => g.id === id))
          .filter(Boolean) as Game[];
        setFavoriteGames(favs);
      }
    } catch {
      setAllGames([]);
      setPlatforms([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleToggleVisible = (id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      persistVisibleIds(next);
      return next;
    });
  };

  const displayedGames = visibleIds.size > 0
    ? allGames.filter((g) => visibleIds.has(g.id))
    : allGames;

  // Stats for the header
  const totalHours = displayedGames.reduce((acc, g) => acc + g.totalHours, 0);
  const totalGames = displayedGames.length;
  const completedGames = displayedGames.filter(
    (g) => g.totalAchievements > 0 && g.completedAchievements >= g.totalAchievements,
  ).length;

  const handleReorderFavorites = (reordered: Game[]) => {
    setFavoriteGames(reordered);
    persistFavoriteIds(reordered);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          name={user?.name || 'Gamer'}
          email={user?.email}
          avatar={user?.avatar}
          stats={[
            { icon: 'sports-esports', iconColor: colors.purple,  value: totalGames,       label: 'Juegos' },
            { icon: 'schedule',    iconColor: '#60A5FA',        value: `${totalHours}h`, label: 'Horas'  },
            { icon: 'emoji-events',          iconColor: colors.warning,  value: completedGames,   label: '100%'   },
          ]}
          platforms={platforms}
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.purple} />
          </View>
        ) : (
          <>
            {/* Mis Favoritos */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="star" size={rw(17)} color="#F59E0B" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Mis Favoritos{favoriteGames.length > 0 ? ` (${favoriteGames.length})` : ''}
                  </Text>
                </View>
                <View style={styles.sectionActions}>
                  <TouchableOpacity
                    style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.purpleMuted }]}
                    onPress={() => setAddModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="add" size={rw(14)} color={colors.text} />
                    <Text style={[styles.pillText, { color: colors.text }]}>Añadir</Text>
                  </TouchableOpacity>
                  {favoriteGames.length > 0 && (
                    <TouchableOpacity
                      style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.purpleMuted }]}
                      onPress={() => setEditModalVisible(true)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="edit" size={rw(13)} color={colors.text} />
                      <Text style={[styles.pillText, { color: colors.text }]}>Editar</Text>
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
                  renderItem={({ item }) => (
                    <GameCard
                      {...item}
                      width={FAV_CARD_W}
                      onPress={() => router.push(`/game/${item.id}`)}
                    />
                  )}
                />
              ) : (
                <View style={[styles.emptyFavs, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialIcons name="star-outline" size={rw(28)} color={colors.textMuted} />
                  <Text style={[styles.emptyFavsText, { color: colors.textMuted }]}>
                    Añadí juegos favoritos para verlos acá
                  </Text>
                </View>
              )}
            </View>

            {/* Todos los juegos */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="sports-esports" size={rw(17)} color={colors.purple} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Todos los Juegos{displayedGames.length > 0 ? ` (${displayedGames.length})` : ''}
                  </Text>
                </View>
              </View>

              {displayedGames.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.purpleMuted }]}>
                    <MaterialIcons name="videogame-asset-off" size={rw(40)} color={colors.purple} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>Todavía no tenés juegos</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    Vinculá una plataforma para ver tus juegos y logros acá.
                  </Text>
                  <TouchableOpacity
                    style={[styles.emptyBtn, { backgroundColor: colors.purple }]}
                    onPress={() => router.push('/tabs/settings')}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="link" size={rw(16)} color={colors.text} />
                    <Text style={[styles.emptyBtnText, { color: colors.text }]}>Vincular plataforma</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.grid, { paddingHorizontal: rs.md, gap: rw(12) }]}>
                  {displayedGames.map((game) => (
                    <GameCard
                      key={game.id}
                      {...game}
                      width={CARD_W}
                      onPress={() => router.push(`/game/${game.id}`)}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <AddGameModal
        visible={addModalVisible}
        platforms={platforms}
        allGames={allGames}
        visibleIds={visibleIds}
        onToggle={handleToggleVisible}
        onClose={() => setAddModalVisible(false)}
      />

      <EditFavoritesModal
        visible={editModalVisible}
        favorites={favoriteGames}
        onReorder={handleReorderFavorites}
        onRemove={(id) => {
          setFavoriteGames((prev) => {
            const next = prev.filter((g) => g.id !== id);
            persistFavoriteIds(next);
            return next;
          });
        }}
        onClose={() => setEditModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { height: rh(200), alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: rh(24) },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs.md,
    marginBottom: rh(12),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(6),
  },
  sectionTitle: {
    fontSize: rf(15),
    fontWeight: '700',
  },
  sectionActions: {
    flexDirection: 'row',
    gap: rw(8),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(4),
    paddingHorizontal: rw(10),
    paddingVertical: rh(5),
    borderRadius: rw(20),
    borderWidth: 1,
  },
  pillText: {
    fontSize: rf(12),
    fontWeight: '600',
  },
  emptyFavs: {
    marginHorizontal: rs.md,
    borderRadius: rw(14),
    borderWidth: 1,
    paddingVertical: rh(20),
    alignItems: 'center',
    gap: rh(8),
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emptyFavsText: {
    fontSize: rf(13),
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyState: {
    margin: rs.md,
    borderRadius: rw(20),
    borderWidth: 1,
    padding: rw(28),
    alignItems: 'center',
    gap: rh(12),
  },
  emptyIcon: {
    width: rw(80),
    height: rw(80),
    borderRadius: rw(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rh(4),
  },
  emptyTitle: { fontSize: rf(18), fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: rf(14), textAlign: 'center', lineHeight: rh(20) },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(6),
    marginTop: rh(8),
    paddingHorizontal: rw(20),
    paddingVertical: rh(12),
    borderRadius: rw(12),
  },
  emptyBtnText: { fontSize: rf(14), fontWeight: '600' },
});
