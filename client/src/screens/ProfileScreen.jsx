// src/screens/ProfileScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
  RefreshControl, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { userService, platformService } from '../services/services';
import { ProfileHeader } from '../components/ProfileHeader';
import { GameCard } from '../components/GameCard';
import { LynkonButton } from '../components/LynkonButton';
import { InfoCard } from '../components/InfoCard';
import { EmptyState } from '../components/EmptyState';
import { colors } from '../theme/colors';
import { ms, fs, wp, hp } from '../theme/responsive';

const PLATFORM_ICONS = { steam: '🟦', psn: '🟦', xbox: '🟩' };
const PLATFORM_LABELS = { steam: 'Steam', psn: 'PlayStation', xbox: 'Xbox' };

export function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const [profile, setProfile]       = useState(null);
  const [platforms, setPlatforms]   = useState([]);
  const [favorites, setFavorites]   = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);

  const loadProfile = useCallback(async () => {
    setError(null);
    try {
      // Perfil del usuario
      const prof = await userService.getMyProfile();
      setProfile(prof);

      // Plataformas vinculadas
      const linked = await platformService.getLinked(user.uid);
      setPlatforms(linked || []);

      // Stats: suma de juegos de todas las plataformas
      if (linked?.length > 0) {
        const allGamesResults = await Promise.allSettled(
          linked.map((p) => platformService.getGames(user.uid, p.platform))
        );
        const allGames = allGamesResults
          .filter((r) => r.status === 'fulfilled')
          .flatMap((r) => r.value || []);

        const unique = Array.from(new Map(allGames.map((g) => [g.gameId, g])).values());
        const favs   = unique.filter((g) => g.isFavorite || g.favoriteRank);
        setFavorites(favs.slice(0, 6));

        setStats({
          totalGames:        unique.length,
          totalHours:        unique.reduce((s, g) => s + (g.playtimeHours || 0), 0),
          totalAchievements: unique.reduce((s, g) => s + (g.achievementsUnlocked || 0), 0),
          friends:           prof?.friends?.length || 0,
        });
      } else {
        setStats({ totalGames: 0, totalHours: 0, totalAchievements: 0, friends: 0 });
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  const handleUnlink = (platform) => {
    Alert.alert(
      `Desvincular ${PLATFORM_LABELS[platform] || platform}`,
      '¿Querés quitar esta plataforma de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            try {
              await platformService.unlink(user.uid, platform);
              setPlatforms((prev) => prev.filter((p) => p.platform !== platform));
              Alert.alert('Listo', `${PLATFORM_LABELS[platform] || platform} desvinculada`);
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.purple} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="No se pudo cargar el perfil"
        description={error}
        actionLabel="Reintentar"
        onAction={() => { setLoading(true); loadProfile(); }}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfile(); }} tintColor={colors.purple} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <ProfileHeader
        user={{ ...user, ...profile, platforms }}
        stats={stats}
        onSettingsPress={() => navigation.navigate('Settings')}
        isOwnProfile
      />

      {/* Plataformas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Plataformas</Text>
        </View>

        {platforms.length === 0 ? (
          <InfoCard
            logo={<Text style={{ fontSize: fs(22) }}>🔗</Text>}
            miniTitle="Sin plataformas"
            title="Vinculá una plataforma"
            description="Conectá Steam, PSN o Xbox para ver tus juegos y logros"
            onPress={() => navigation.navigate('LinkPlatform')}
            rightContent={<Text style={{ color: colors.purpleLight, fontSize: fs(20) }}>›</Text>}
          />
        ) : (
          <>
            {platforms.map((p) => (
              <InfoCard
                key={p.platform}
                logo={<Text style={{ fontSize: fs(22) }}>{PLATFORM_ICONS[p.platform] || '🎮'}</Text>}
                miniTitle={`Vinculada · ${new Date(p.linkedAt).toLocaleDateString('es-AR')}`}
                title={PLATFORM_LABELS[p.platform] || p.platform}
                description={p.platformUserId !== '[LINKED]' ? p.platformUserId : 'Conectada'}
                rightContent={
                  <TouchableOpacity onPress={() => handleUnlink(p.platform)}>
                    <Text style={styles.unlinkText}>Desvincular</Text>
                  </TouchableOpacity>
                }
              />
            ))}
            <LynkonButton
              title="+ Agregar plataforma"
              variant="secondary"
              size="sm"
              onPress={() => navigation.navigate('LinkPlatform')}
            />
          </>
        )}
      </View>

      {/* Juegos favoritos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Juegos favoritos</Text>
        {favorites.length === 0 ? (
          <View style={styles.emptyFavs}>
            <Text style={styles.emptyFavsIcon}>⭐</Text>
            <Text style={styles.emptyFavsText}>
              {platforms.length === 0
                ? 'Vinculá una plataforma para ver tus favoritos'
                : 'Marcá juegos como favoritos desde tu biblioteca'}
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.favRow}>
              {favorites.map((g) => (
                <GameCard
                  key={g.gameId}
                  game={{
                    ...g,
                    id:                    g.gameId,
                    cover:                 g.iconUrl || `https://picsum.photos/seed/${g.gameId}/400/600`,
                    totalHours:            g.playtimeHours || 0,
                    totalAchievements:     g.totalAchievements || 0,
                    completedAchievements: g.achievementsUnlocked || 0,
                    platforms:             [{ name: g.platform }],
                  }}
                  onPress={() => navigation.navigate('Home')}
                  style={styles.favCard}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <LynkonButton title="Cerrar sesión" variant="danger" onPress={handleLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: ms(12) },
  loadingText:  { color: colors.textMuted, fontSize: fs(14) },
  content:      { padding: ms(16), paddingBottom: 100, gap: ms(20) },
  section:      { gap: ms(10) },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.text, fontSize: fs(16), fontWeight: '700' },
  unlinkText:   { color: colors.error, fontSize: fs(12), fontWeight: '500' },
  favRow:       { flexDirection: 'row', gap: ms(12) },
  favCard:      { width: 140 },
  emptyFavs:    { backgroundColor: colors.card, borderRadius: ms(14), borderWidth: 1, borderColor: colors.border, padding: ms(20), alignItems: 'center', gap: ms(8) },
  emptyFavsIcon:{ fontSize: 32 },
  emptyFavsText:{ color: colors.textMuted, fontSize: fs(13), textAlign: 'center' },
});
