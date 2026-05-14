// src/screens/HomeScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { platformService } from '../services/services';
import { GameCard } from '../components/GameCard';
import { SearchBar } from '../components/SearchBar';
import { InfoCard } from '../components/InfoCard';
import { EmptyState } from '../components/EmptyState';
import { colors } from '../theme/colors';
import { ms, fs, wp, hp } from '../theme/responsive';

export function HomeScreen({ navigation }) {
  const { user } = useAuth();

  const [games, setGames]           = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [platforms, setPlatforms]   = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);
  const [lastSync, setLastSync]     = useState(null);
  const [syncing, setSyncing]       = useState(false);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const linked = await platformService.getLinked(user.uid);
      setPlatforms(linked || []);

      if (!linked || linked.length === 0) {
        setGames([]);
        setFiltered([]);
        return;
      }

      const results = await Promise.allSettled(
        linked.map((p) => platformService.getGames(user.uid, p.platform))
      );

      const allGames = results
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => r.value || []);

      const unique = Array.from(
        new Map(allGames.map((g) => [g.gameId, g])).values()
      );

      setGames(unique);
      setFiltered(unique);
      setLastSync(new Date());

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        Alert.alert(
          'Aviso',
          `No se pudieron cargar los juegos de ${failed.length} plataforma(s). Intentá de nuevo más tarde.`
        );
      }
    } catch (err) {
      setError(err.message || 'Error al cargar tus juegos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(games);
    } else {
      setFiltered(
        games.filter((g) => g.name?.toLowerCase().includes(search.toLowerCase()))
      );
    }
  }, [search, games]);

  const handleRefresh = () => { setRefreshing(true); loadData(); };

  const handleSync = async () => {
    setSyncing(true);
    await loadData();
    setSyncing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.purple} />
        <Text style={styles.loadingText}>Cargando tu biblioteca...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Algo salió mal"
        description={error}
        actionLabel="Reintentar"
        onAction={() => { setLoading(true); loadData(); }}
      />
    );
  }

  if (platforms.length === 0) {
    return (
      <EmptyState
        icon="🔗"
        title="Sin plataformas vinculadas"
        description="Vinculá tu cuenta de Steam, PSN o Xbox para ver tu biblioteca de juegos acá."
        actionLabel="Vincular plataforma"
        onAction={() => navigation.navigate('Profile')}
      />
    );
  }

  const totalHours = games.reduce((s, g) => s + (g.playtimeHours || 0), 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.gameId}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.greeting}>Hola, {user?.username || user?.name} 👾</Text>
                <Text style={styles.subtitle}>
                  {games.length} juego{games.length !== 1 ? 's' : ''} en tu biblioteca
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.syncBtn, syncing && styles.syncBtnActive]}
                onPress={handleSync}
                disabled={syncing}
                activeOpacity={0.8}
              >
                {syncing
                  ? <ActivityIndicator size="small" color={colors.purpleLight} />
                  : <Text style={styles.syncIcon}>↻</Text>
                }
              </TouchableOpacity>
            </View>
            {lastSync && (
              <Text style={styles.lastSync}>
                Última sync: {lastSync.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            <View style={styles.statsRow}>
              <InfoCard style={styles.statCard} miniTitle="Total" title={`${totalHours}h`} description="Horas jugadas" />
              <InfoCard style={styles.statCard} miniTitle="Plataformas" title={`${platforms.length}`} description="Vinculadas" />
            </View>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar juego..." style={styles.search} />
            {filtered.length > 0 && <Text style={styles.sectionTitle}>Biblioteca</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <GameCard
            game={{
              ...item,
              id:                    item.gameId,
              cover:                 item.iconUrl || `https://picsum.photos/seed/${item.gameId}/400/600`,
              totalHours:            item.playtimeHours || 0,
              totalAchievements:     item.totalAchievements || 0,
              completedAchievements: item.achievementsUnlocked || 0,
              platforms:             [{ name: item.platform }],
            }}
            onPress={() => navigation.navigate('GameDetail', { game: item })}
          />
        )}
        ListEmptyComponent={
          search.trim() ? (
            <EmptyState
              icon="🔍"
              title="Sin resultados"
              description={`No encontramos ningún juego con "${search}"`}
              actionLabel="Limpiar búsqueda"
              onAction={() => setSearch('')}
            />
          ) : (
            <EmptyState
              icon="🎮"
              title="Sin juegos todavía"
              description="Tus juegos aparecerán acá cuando sincronicemos tus plataformas."
              actionLabel="Sincronizar ahora"
              onAction={handleRefresh}
            />
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.purple} />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: ms(12) },
  loadingText:  { color: colors.textMuted, fontSize: fs(14) },
  list:         { padding: ms(16), paddingBottom: 100 },
  emptyList:    { flexGrow: 1, padding: ms(16) },
  header:       { marginBottom: 16, gap: ms(10) },
  topRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting:     { color: colors.text, fontSize: fs(24), fontWeight: '800' },
  subtitle:     { color: colors.textMuted, fontSize: fs(13), marginTop: 2 },
  lastSync:     { color: colors.textMuted, fontSize: fs(11), marginTop: -4 },
  syncBtn:      { width: 42, height: 42, borderRadius: ms(12), backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  syncBtnActive:{ borderColor: colors.purple, backgroundColor: colors.purpleMuted },
  statsRow:     { flexDirection: 'row', gap: ms(10) },
  statCard:     { flex: 1 },
  search:       { marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: fs(16), fontWeight: '700', marginTop: 4 },
  row:          { justifyContent: 'space-between' },
});
