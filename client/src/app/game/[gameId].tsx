import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { platformApi } from '@/services/api';
import { rw, rh, rf, rs, SCREEN_WIDTH } from '@/utils/responsive';
import { colors } from '@/theme/colors';
import { InfoCard, AppButton } from '@/components';

const PLATFORM_ICONS: Record<string, string> = { steam: '🎮', playstation: '🎯', nintendo: '🕹️', xbox: '🟢' };

interface GameDetail {
  id: string;
  name: string;
  cover: string;
  rank: number;
  totalHours: number;
  totalAchievements: number;
  completedAchievements: number;
  platforms: {
    name: string;
    hours: number;
    achievements: number;
    completedAchievements: number;
  }[];
}

export default function GameDetailScreen() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadGame = async () => {
      if (!gameId) {
        setLoading(false);
        return;
      }

      try {
        const platRes = await platformApi.getLinkedPlatforms();
        const linked: string[] = (platRes.data || []).map((p: any) => p.platform || p.name);

        for (const plat of linked) {
          try {
            const gamesRes = await platformApi.getPlatformGames(plat);
            const platformGames = gamesRes.data || [];
            const match = platformGames.find((g: any) => String(g.id) === String(gameId));
            if (!match) continue;

            const normalizedGame: GameDetail = {
              id: String(match.id),
              name: match.name || match.title || 'Unknown',
              cover: match.cover || match.imageUrl || '',
              rank: 1,
              totalHours: match.totalHours || match.playtime || 0,
              totalAchievements: match.totalAchievements || 0,
              completedAchievements: match.completedAchievements || 0,
              platforms: [{
                name: plat,
                hours: match.totalHours || match.playtime || 0,
                achievements: match.totalAchievements || 0,
                completedAchievements: match.completedAchievements || 0,
              }],
            };

            if (active) setGame(normalizedGame);
            break;
          } catch {}
        }
      } catch {
        if (active) setGame(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadGame();
    return () => { active = false; };
  }, [gameId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      </SafeAreaView>
    );
  }

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { top: rh(16), left: rw(16) }]}>
          <Ionicons name="arrow-back" size={rw(24)} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={{ color: colors.textMuted, fontSize: rf(16) }}>Juego no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalPct = game.totalAchievements
    ? Math.round((game.completedAchievements / game.totalAchievements) * 100)
    : 0;
  const coverHeight = Math.min(SCREEN_WIDTH * 0.9, rh(320));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Portada */}
        <View style={[styles.coverContainer, { height: coverHeight }]}>
          <Image source={{ uri: game.cover }} style={styles.cover} resizeMode="cover" />
          <View style={styles.coverOverlay} />
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { top: rh(16), left: rw(16), width: rw(40), height: rw(40), borderRadius: rw(20) }]}>
            <Ionicons name="arrow-back" size={rw(22)} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.rankBadge, { top: rh(16), right: rw(16), backgroundColor: colors.purple }]}>
            <Text style={styles.rankText}>#{game.rank}</Text>
          </View>
          <View style={styles.titleOverlay}>
            <Text style={styles.gameTitle}>{game.name}</Text>
            <View style={styles.platformsRow}>
              {game.platforms.map((p) => (
                <View key={p.name} style={styles.platformBadge}>
                  <Text style={{ fontSize: rf(13) }}>{PLATFORM_ICONS[p.name] || '🎮'}</Text>
                  <Text style={styles.platformLabel}>{p.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ padding: rs.md, gap: rh(12) }}>
          {/* Stats generales — InfoCard components en fila */}
          <View style={styles.statsRow}>
            <InfoCard
              icon="time-outline"
              iconColor={colors.purple}
              miniTitle="HORAS"
              title="Totales"
              value={`${game.totalHours}h`}
              layout="vertical"
            />
            <InfoCard
              icon="trophy-outline"
              iconColor={colors.warning}
              iconBg="#FEF3C7"
              miniTitle="LOGROS"
              title="Completados"
              value={`${game.completedAchievements}/${game.totalAchievements}`}
              layout="vertical"
            />
            <InfoCard
              icon="ribbon-outline"
              iconColor={colors.purpleLight}
              miniTitle="PROGRESO"
              title="General"
              value={`${totalPct}%`}
              layout="vertical"
            />
          </View>

          {/* Por plataforma — InfoCard component */}
          {game.platforms.map((p) => {
            const pPct = Math.round((p.completedAchievements / p.achievements) * 100);
            return (
              <InfoCard
                key={p.name}
                emoji={PLATFORM_ICONS[p.name]}
                title={p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                miniTitle={`${p.hours}h · ${p.completedAchievements}/${p.achievements} logros`}
                description={`Progreso: ${pPct}%`}
                layout="horizontal"
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  coverContainer: { position: 'relative' },
  cover: { width: '100%', height: '100%' },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  backBtn: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  rankBadge: { position: 'absolute', paddingHorizontal: rw(12), paddingVertical: rh(5), borderRadius: rw(10) },
  rankText: { color: '#fff', fontSize: rf(13), fontWeight: '700' },
  titleOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: rw(20), backgroundColor: 'rgba(0,0,0,0.6)' },
  gameTitle: { color: '#fff', fontSize: rf(22), fontWeight: '700', marginBottom: rh(8) },
  platformsRow: { flexDirection: 'row', gap: rw(8) },
  platformBadge: { flexDirection: 'row', alignItems: 'center', gap: rw(6), backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: rw(10), paddingVertical: rh(4), borderRadius: rw(8) },
  platformLabel: { color: '#fff', fontSize: rf(12), textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', gap: rw(10) },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
