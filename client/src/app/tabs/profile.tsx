import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext'; // FIX: usar useTheme en vez de import directo
import { platformApi } from '@/services/api';
import { rw, rh, rf, rs, gridColumns, cardWidth } from '@/utils/responsive';
import { GameCard, ProfileHeader, AppButton } from '@/components';
import { Ionicons } from '@expo/vector-icons';

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

const COLS = gridColumns();
const CARD_W = cardWidth(COLS);
const FAV_CARD_W = cardWidth(Math.min(COLS + 1, 3));

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme(); // FIX: consistente con el resto de la app
  const [games, setGames] = useState<Game[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const platRes = await platformApi.getLinkedPlatforms();
      const linked: string[] = (platRes.data || []).map((p: any) => p.platform || p.name);
      setPlatforms(linked);
      const allGames: Game[] = [];
      for (const plat of linked) {
        try {
          const gRes = await platformApi.getPlatformGames(plat);
          const serverGames: Game[] = (gRes.data || []).map((g: any, i: number) => ({
            id: g.id || String(i),
            name: g.name || g.title || 'Unknown',
            cover: g.cover || g.imageUrl || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop',
            rank: i + 1,
            totalHours: g.totalHours || g.playtime || 0,
            totalAchievements: g.totalAchievements || 100,
            completedAchievements: g.completedAchievements || 0,
            platforms: [{ name: plat as any, hours: g.totalHours || 0, achievements: g.totalAchievements || 100, completedAchievements: g.completedAchievements || 0 }],
          }));
          allGames.push(...serverGames);
        } catch {}
      }
      setGames(allGames);
    } catch {
      setGames([]);
      setPlatforms([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const totalAchievements = games.reduce((acc, g) => acc + g.completedAchievements, 0);
  const favoriteGames = games.filter((g) => g.isFavorite).sort((a, b) => (a.favoriteRank || 0) - (b.favoriteRank || 0));

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
            { icon: 'trophy',          iconColor: colors.warning, value: totalAchievements, label: 'Logros'    },
            { icon: 'game-controller', iconColor: colors.purple,  value: games.length,      label: 'Juegos'    },
            { icon: 'star',            iconColor: '#F59E0B',       value: favoriteGames.length, label: 'Favoritos' },
          ]}
          platforms={platforms}
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.purple} />
          </View>
        ) : (
          <>
            {favoriteGames.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>⭐ Favoritos</Text>
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
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🎮 Todos los juegos</Text>
              {games.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.purpleMuted }]}>
                    <Ionicons name="game-controller-outline" size={rw(40)} color={colors.purple} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>Todavía no tenés juegos</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    Vinculá una plataforma para ver tus juegos y logros acá.
                  </Text>
                  <AppButton
                    label="Vincular plataforma"
                    icon="link-outline"
                    onPress={() => router.push('/tabs/settings')}
                    fullWidth={false}
                    style={styles.emptyBtn}
                  />
                </View>
              ) : (
                <View style={[styles.grid, { paddingHorizontal: rs.md, gap: rw(12) }]}>
                  {games.map((game) => (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { height: rh(200), alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: rh(24) },
  sectionTitle: { fontSize: rf(16), fontWeight: '600', paddingHorizontal: rs.md, marginBottom: rh(12) },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyState: { margin: rs.md, borderRadius: rw(20), borderWidth: 1, padding: rw(28), alignItems: 'center', gap: rh(12) },
  emptyIcon: { width: rw(80), height: rw(80), borderRadius: rw(40), alignItems: 'center', justifyContent: 'center', marginBottom: rh(4) },
  emptyTitle: { fontSize: rf(18), fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { fontSize: rf(14), textAlign: 'center', lineHeight: rh(20) },
  emptyBtn: { marginTop: rh(8) },
});