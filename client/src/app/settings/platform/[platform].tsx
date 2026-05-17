import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { platformApi } from '@/services/api';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { PLATFORM_LABELS, PLATFORM_LOGOS, normalizePlatformId } from '@/constants/platforms';

export default function PlatformGamesScreen() {
  const router = useRouter();
  const { platform } = useLocalSearchParams<{ platform: string }>();
  const platformId = normalizePlatformId(platform);
  const { colors } = useTheme();
  const [games, setGames] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!platformId) {
        setLoading(false);
        return;
      }

      try {
        const platRes = await platformApi.getLinkedPlatforms();
        const linked = new Set(
          (platRes.data || [])
            .map((p: any) => normalizePlatformId(p.platform || p.name))
            .filter(Boolean)
        );

        setConnected(linked.has(platformId));

        const statsRes = await platformApi.getPlatformStats(platformId);
        setStats(statsRes.data);
        const gamesRes = await platformApi.getPlatformGames(platformId);
        setGames(gamesRes.data || []);
      } catch {
        setGames([]);
        setStats(null);
        setConnected(false);
      } finally { setLoading(false); }
    };
    if (platformId) load();
    else setLoading(false);
  }, [platformId]);

  const handleUnlink = () => {
    if (!platformId) return;

    Alert.alert(
      'Desvincular plataforma',
      `¿Seguro que querés desvincular ${PLATFORM_LABELS[platformId]}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desvincular', style: 'destructive', onPress: async () => {
          try { await platformApi.unlinkPlatform(platformId); router.back(); }
          catch { Alert.alert('Error', 'No se pudo desvincular'); }
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.backgroundGrad, borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={rw(24)} color={colors.purple} />
          </TouchableOpacity>
          <View style={styles.platformInfo}>
            {platformId ? (
              <Image
                source={PLATFORM_LOGOS[platformId]}
                style={[styles.platformLogo, { width: rw(38), height: rw(38) }]}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="game-controller-outline" size={rw(32)} color={colors.purple} />
            )}
            <View>
              <Text style={[styles.platformName, { color: colors.text, fontSize: rf(18) }]}>
                {platformId ? PLATFORM_LABELS[platformId] : platform}
              </Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: connected ? '#22C55E' : colors.textMuted, width: rw(8), height: rw(8), borderRadius: rw(4) }]} />
                <Text style={[{ color: connected ? '#22C55E' : colors.textMuted, fontSize: rf(13) }]}>
                  {connected ? 'Conectado' : 'No conectado'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={[styles.loadingContainer, { height: rh(200) }]}>
            <ActivityIndicator size="large" color={colors.purple} />
          </View>
        ) : (
          <View style={[styles.content, { padding: rs.md, gap: rh(16) }]}>
            {stats && (
              <View style={styles.statsRow}>
                {[
                  { value: stats.gamesCount || games.length, label: 'Juegos' },
                  { value: `${stats.totalHours || 0}h`, label: 'Horas' },
                  { value: stats.achievements || 0, label: 'Logros' },
                ].map(({ value, label }) => (
                  <View key={label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.statNumber, { color: colors.text, fontSize: rf(22) }]}>{value}</Text>
                    <Text style={[{ color: colors.textMuted, fontSize: rf(12), marginTop: rh(2) }]}>{label}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: rf(16) }]}>Juegos ({games.length})</Text>

            {games.map((game: any, index: number) => {
              const pct = game.totalAchievements
                ? Math.round((game.completedAchievements / game.totalAchievements) * 100)
                : 0;
              return (
                <View key={game.id || index} style={[styles.gameRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  {game.cover ? (
                    <Image source={{ uri: game.cover }} style={[styles.gameCover, { width: rw(70), height: rw(70) }]} resizeMode="cover" />
                  ) : (
                    <View style={[styles.gameCoverPlaceholder, { backgroundColor: colors.purpleDim, width: rw(70), height: rw(70) }]}>
                      <Ionicons name="game-controller-outline" size={rw(24)} color={colors.purple} />
                    </View>
                  )}
                  <View style={styles.gameInfo}>
                    <Text style={[styles.gameName, { color: colors.text, fontSize: rf(14) }]} numberOfLines={1}>
                      {game.name || game.title}
                    </Text>
                    <Text style={[{ color: colors.textMuted, fontSize: rf(12), marginTop: rh(4) }]}>
                      {game.totalHours || game.playtime || 0}h jugadas
                    </Text>
                    {game.totalAchievements > 0 && (
                      <View style={{ marginTop: rh(6) }}>
                        <View style={[styles.progressBar, { backgroundColor: colors.purpleDim, height: rh(4) }]}>
                          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.purple }]} />
                        </View>
                        <Text style={[{ color: colors.textMuted, fontSize: rf(11), marginTop: rh(2) }]}>
                          {game.completedAchievements}/{game.totalAchievements} logros
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {connected && (
              <TouchableOpacity style={[styles.unlinkButton, { borderColor: '#EF4444' }]} onPress={handleUnlink}>
                <Ionicons name="unlink-outline" size={rw(18)} color="#EF4444" />
                <Text style={[styles.unlinkText, { fontSize: rf(15) }]}>Desvincular plataforma</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs.md, paddingVertical: rh(14), borderBottomWidth: 1, gap: rw(16) },
  backButton: {},
  platformInfo: { flexDirection: 'row', alignItems: 'center', gap: rw(16) },
  platformLogo: {},
  platformName: { fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: rw(6), marginTop: rh(2) },
  statusDot: {},
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
  content: {},
  statsRow: { flexDirection: 'row', gap: rw(12) },
  statCard: { flex: 1, alignItems: 'center', padding: rw(16), borderRadius: rw(12), borderWidth: 1 },
  statNumber: { fontWeight: '700' },
  sectionTitle: { fontWeight: '600' },
  gameRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: rw(12),
    borderWidth: 1, overflow: 'hidden',
  },
  gameCover: {},
  gameCoverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  gameInfo: { flex: 1, padding: rw(12) },
  gameName: { fontWeight: '600' },
  progressBar: { borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  unlinkButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rw(8), padding: rh(14), borderRadius: rw(12), borderWidth: 1, marginTop: rh(8),
  },
  unlinkText: { color: '#EF4444', fontWeight: '600' },
});
