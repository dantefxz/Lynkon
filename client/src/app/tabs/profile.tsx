import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, ActivityIndicator,
  RefreshControl, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { platformApi, userApi } from '@/services/api';
import { rw, rh, rf, rs, gridColumns, cardWidth } from '@/utils/responsive';
import { GameCard, ProfileHeader } from '@/components';
import { AddGameModal } from '@/components/AddGameModal';
import { EditFavoritesModal } from '@/components/EditFavoritesModal';

interface Game {
  id: string;
  name: string;
  cover: string;
  rank: number;
  totalHours: number;
  totalAchievements: number;
  completedAchievements: number;
  platform?: string;
  isFavorite?: boolean;
  platforms: { name: string; hours: number; achievements: number; completedAchievements: number }[];
}

const COLS     = gridColumns();
const CARD_W   = cardWidth(COLS);
const FAV_CARD_W = cardWidth(Math.min(COLS + 1, 3));

export default function ProfileScreen() {
  const router      = useRouter();
  const { user }    = useAuth();
  const { colors }  = useTheme();

  const [allGames, setAllGames]         = useState<Game[]>([]);
  const [platforms, setPlatforms]       = useState<string[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  // Visibilidad — cargada desde la API (hidden = true → oculto del perfil público)
  const [hiddenIds, setHiddenIds]       = useState<Set<string>>(new Set());

  // Favoritos — cargados desde la API
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);

  const [addModalVisible, setAddModalVisible]   = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

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

      // 2. Juegos de todas las plataformas
      const fetched: Game[] = [];
      for (const plat of linked) {
        try {
          const gRes = await platformApi.getPlatformGames(plat);
          const serverGames: Game[] = ((gRes.data as any)?.games || gRes.data || []).map(
            (g: any, i: number) => ({
              id:                    String(g.id || `${plat}_${i}`),
              name:                  g.name || g.title || 'Unknown',
              cover:                 g.cover || g.imageUrl || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop',
              rank:                  i + 1,
              totalHours:            g.totalHours || g.playtime || 0,
              totalAchievements:     g.totalAchievements || 100,
              completedAchievements: g.completedAchievements || 0,
              platform:              plat,
              platforms: [{ name: plat, hours: g.totalHours || 0, achievements: g.totalAchievements || 100, completedAchievements: g.completedAchievements || 0 }],
            }),
          );
          fetched.push(...serverGames);
        } catch {}
      }
      setAllGames(fetched);

      // 3. Visibilidad desde la API
      try {
        const visRes  = await platformApi.getGameVisibility();
        const visData = (visRes.data as any)?.visibility || {};
        const hidden  = new Set<string>(
          Object.values(visData)
            .filter((v: any) => v.hidden)
            .map((v: any) => v.gameId),
        );
        setHiddenIds(hidden);
      } catch {}

      // 4. Favoritos desde la API
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

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  // ── Favoritos ──────────────────────────────────────────────────────────────
  const handleAddFavorite = async (game: Game) => {
    if (!user?.id) return;
    try {
      await userApi.addFavorite(user.id, game.id, game.name, game.platform || 'steam');
      setFavoriteGames((prev) => (prev.find((g) => g.id === game.id) ? prev : [...prev, game]));
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'No se pudo agregar a favoritos';
      Alert.alert('Error', msg);
    }
  };

  const handleRemoveFavorite = async (gameId: string) => {
    if (!user?.id) return;
    const game = allGames.find((g) => g.id === gameId);
    try {
      await userApi.removeFavorite(user.id, gameId, game?.platform);
      setFavoriteGames((prev) => prev.filter((g) => g.id !== gameId));
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'No se pudo eliminar de favoritos';
      Alert.alert('Error', msg);
    }
  };

  const handleReorderFavorites = (reordered: Game[]) => setFavoriteGames(reordered);

  // ── Juegos visibles (los no ocultos se muestran en el perfil público) ───────
  const displayedGames = allGames.filter((g) => !hiddenIds.has(g.id));

  // Stats para el header
  const totalHours    = displayedGames.reduce((acc, g) => acc + g.totalHours, 0);
  const totalGames    = displayedGames.length;
  const completedGames = displayedGames.filter(
    (g) => g.totalAchievements > 0 && g.completedAchievements >= g.totalAchievements,
  ).length;

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
            { icon: 'schedule',       iconColor: '#60A5FA',       value: `${totalHours}h`, label: 'Horas'  },
            { icon: 'emoji-events',   iconColor: colors.warning,  value: completedGames,   label: '100%'   },
          ]}
          platforms={platforms}
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.purple} />
          </View>
        ) : (
          <>
            {/* ── Mis Favoritos ── */}
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

            {/* ── Todos los juegos ── */}
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
        visibleIds={new Set(allGames.filter((g) => !hiddenIds.has(g.id)).map((g) => g.id))}
        onToggle={(id) => {
          // El toggle de visibilidad se maneja en la pantalla de plataforma
          // Aquí AddGameModal se usa para agregar a favoritos
          const game = allGames.find((g) => g.id === id);
          if (!game) return;
          const isFav = favoriteGames.some((g) => g.id === id);
          if (isFav) handleRemoveFavorite(id);
          else handleAddFavorite(game);
        }}
        onClose={() => setAddModalVisible(false)}
      />

      <EditFavoritesModal
        visible={editModalVisible}
        favorites={favoriteGames}
        onReorder={handleReorderFavorites}
        onRemove={handleRemoveFavorite}
        onClose={() => setEditModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  loading:        { height: rh(200), alignItems: 'center', justifyContent: 'center' },
  section:        { marginBottom: rh(24) },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: rs.md, marginBottom: rh(12) },
  sectionTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: rw(6) },
  sectionTitle:   { fontSize: rf(15), fontWeight: '700' },
  sectionActions: { flexDirection: 'row', gap: rw(8) },
  pill:           { flexDirection: 'row', alignItems: 'center', gap: rw(4), paddingHorizontal: rw(10), paddingVertical: rh(5), borderRadius: rw(20), borderWidth: 1 },
  pillText:       { fontSize: rf(12), fontWeight: '600' },
  emptyFavs:      { marginHorizontal: rs.md, borderRadius: rw(14), borderWidth: 1, paddingVertical: rh(20), alignItems: 'center', gap: rh(8), flexDirection: 'row', justifyContent: 'center' },
  emptyFavsText:  { fontSize: rf(13) },
  grid:           { flexDirection: 'row', flexWrap: 'wrap' },
  emptyState:     { margin: rs.md, borderRadius: rw(20), borderWidth: 1, padding: rw(28), alignItems: 'center', gap: rh(12) },
  emptyIcon:      { width: rw(80), height: rw(80), borderRadius: rw(40), alignItems: 'center', justifyContent: 'center', marginBottom: rh(4) },
  emptyTitle:     { fontSize: rf(18), fontWeight: '700', textAlign: 'center' },
  emptySubtitle:  { fontSize: rf(14), textAlign: 'center', lineHeight: rh(20) },
  emptyBtn:       { flexDirection: 'row', alignItems: 'center', gap: rw(6), marginTop: rh(8), paddingHorizontal: rw(20), paddingVertical: rh(12), borderRadius: rw(12) },
  emptyBtnText:   { fontSize: rf(14), fontWeight: '600' },
});
