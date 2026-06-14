import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image,
  ActivityIndicator, TouchableOpacity, FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { platformApi } from '@/services/api';
import { rw, rh, rf, rs, SCREEN_WIDTH } from '@/utils/responsive';
import { useTheme } from '@/context/ThemeContext';
import { PLATFORM_LOGOS, normalizePlatformId } from '@/constants/platforms';

interface Achievement {
  apiname: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt: number | string | null;
  icon: string | null;
  iconLocked?: string | null;
}

interface GameDetail {
  id: string;
  name: string;
  cover: string;
  totalHours: number;
  totalAchievements: number;
  completedAchievements: number;
  platform: string;
}

function formatDate(ts: number | string | null): string {
  if (!ts) return '';
  const d = new Date(typeof ts === 'number' ? ts * 1000 : ts);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function GameDetailScreen() {
  const { colors } = useTheme();
  const router    = useRouter();
  const { gameId, platform: platformParam } = useLocalSearchParams<{ gameId: string; platform?: string }>();

  const [game,         setGame]         = useState<GameDetail | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingAchs,  setLoadingAchs]  = useState(false);
  const [showLocked,   setShowLocked]   = useState(false);

  useEffect(() => {
    let active = true;

    const loadGame = async () => {
      if (!gameId) { setLoading(false); return; }

      try {
        const platRes  = await platformApi.getLinkedPlatforms();
        const linked: string[] = ((platRes.data as any)?.platforms || []).map(
          (p: any) => p.platform || p.name
        );

        // If platform hint provided in params, try it first
        const ordered = platformParam
          ? [platformParam, ...linked.filter((p) => p !== platformParam)]
          : linked;

        for (const plat of ordered) {
          try {
            const gamesRes = await platformApi.getPlatformGames(plat);
            const list: any[] = (gamesRes.data as any)?.games || gamesRes.data || [];
            const match = list.find(
              (g: any) => String(g.gameId) === String(gameId) || String(g.id) === String(gameId)
            );
            if (!match) continue;

            if (active) {
              setGame({
                id:                    String(match.gameId || match.id),
                name:                  match.name || match.title || 'Unknown',
                cover:                 match.cover || match.imageUrl || match.iconUrl || '',
                totalHours:            match.playtimeHours || match.totalHours || match.playtime || 0,
                totalAchievements:     match.totalAchievements || 0,
                completedAchievements: match.completedAchievements || 0,
                platform:              plat,
              });

              // Load achievements in background
              setLoadingAchs(true);
              try {
                const achRes = await (platformApi as any).getGameAchievements(plat, String(match.gameId || match.id));
                if (active) setAchievements((achRes.data as any)?.achievements || []);
              } catch {} finally {
                if (active) setLoadingAchs(false);
              }
            }
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
  }, [gameId, platformParam]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      </SafeAreaView>
    );
  }

  if (!game) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnAbs}>
          <MaterialIcons name="arrow-back" size={rw(24)} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.center}>
          <MaterialIcons name="videogame-asset-off" size={rw(48)} color={colors.textMuted} />
          <Text style={[styles.notFoundText, { color: colors.textMuted, marginTop: rh(12) }]}>Juego no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalPct   = game.totalAchievements
    ? Math.round((game.completedAchievements / game.totalAchievements) * 100)
    : 0;
  const coverH     = Math.min(SCREEN_WIDTH * 0.85, rh(280));
  const platformId = normalizePlatformId(game.platform);
  const platLogo   = platformId ? PLATFORM_LOGOS[platformId] : null;

  const unlockedAchs = achievements.filter((a) => a.unlocked);
  const lockedAchs   = achievements.filter((a) => !a.unlocked);
  const displayedAchs = showLocked ? achievements : unlockedAchs;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Portada */}
        <View style={[styles.coverContainer, { height: coverH }]}>
          {game.cover ? (
            <Image source={{ uri: game.cover }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, { backgroundColor: colors.card }]} />
          )}
          <View style={styles.coverOverlay} />
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={rw(22)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.titleOverlay}>
            <Text style={styles.gameTitle}>{game.name}</Text>
            <View style={styles.platformRow}>
              {platLogo
                ? <Image source={platLogo} style={styles.platformLogo} resizeMode="contain" />
                : <MaterialIcons name="sports-esports" size={rw(16)} color="#fff" />}
              <Text style={styles.platformLabel}>{game.platform}</Text>
            </View>
          </View>
        </View>

        <View style={{ padding: rs.md, gap: rh(16) }}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialIcons name="schedule" size={rw(20)} color={colors.purple} />
              <Text style={[styles.statValue, { color: colors.text }]}>{game.totalHours}h</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Horas</Text>
            </View>
            {game.totalAchievements > 0 && (
              <>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialIcons name="emoji-events" size={rw(20)} color="#F59E0B" />
                  <Text style={[styles.statValue, { color: colors.text }]}>{game.completedAchievements}/{game.totalAchievements}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Logros</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialIcons name="bar-chart" size={rw(20)} color={colors.purple} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{totalPct}%</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Progreso</Text>
                </View>
              </>
            )}
          </View>

          {/* Logros */}
          {loadingAchs ? (
            <View style={styles.achLoading}>
              <ActivityIndicator color={colors.purple} />
              <Text style={[styles.achLoadingText, { color: colors.textMuted }]}>Cargando logros...</Text>
            </View>
          ) : achievements.length > 0 ? (
            <View style={[styles.achCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.achHeader}>
                <Text style={[styles.achTitle, { color: colors.text }]}>
                  Logros ({unlockedAchs.length}/{achievements.length})
                </Text>
                {lockedAchs.length > 0 && (
                  <TouchableOpacity
                    style={[styles.pill, { borderColor: colors.border }]}
                    onPress={() => setShowLocked((v) => !v)}
                  >
                    <Text style={[styles.pillText, { color: colors.textMuted }]}>
                      {showLocked ? 'Solo obtenidos' : 'Mostrar todos'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {displayedAchs.length === 0 ? (
                <Text style={{ color: colors.textMuted, fontSize: rf(13), textAlign: 'center', paddingVertical: rh(12) }}>
                  No tenés logros desbloqueados aún
                </Text>
              ) : (
                displayedAchs.map((ach) => {
                  const iconUri = ach.unlocked ? ach.icon : (ach.iconLocked || ach.icon);
                  return (
                    <View
                      key={ach.apiname}
                      style={[styles.achRow, { borderBottomColor: colors.border, opacity: ach.unlocked ? 1 : 0.45 }]}
                    >
                      {iconUri ? (
                        <Image source={{ uri: iconUri }} style={styles.achIcon} />
                      ) : (
                        <View style={[styles.achIconPlaceholder, { backgroundColor: colors.purpleMuted }]}>
                          <MaterialIcons name="emoji-events" size={rw(18)} color={ach.unlocked ? '#F59E0B' : colors.textMuted} />
                        </View>
                      )}
                      <View style={styles.achInfo}>
                        <Text style={[styles.achName, { color: colors.text }]} numberOfLines={1}>{ach.name}</Text>
                        {ach.description ? (
                          <Text style={[styles.achDesc, { color: colors.textMuted }]} numberOfLines={2}>{ach.description}</Text>
                        ) : null}
                        {ach.unlocked && ach.unlockedAt ? (
                          <Text style={[styles.achDate, { color: colors.purple }]}>{formatDate(ach.unlockedAt)}</Text>
                        ) : null}
                      </View>
                      {ach.unlocked && (
                        <MaterialIcons name="check-circle-outline" size={rw(18)} color="#22C55E" />
                      )}
                    </View>
                  );
                })
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1 },
  center:             { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText:       { fontSize: rf(16) },
  backBtnAbs:         { position: 'absolute', top: rh(16), left: rw(16), zIndex: 10, padding: rw(8) },
  coverContainer:     { position: 'relative' },
  cover:              { width: '100%', height: '100%' },
  coverOverlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  backBtn:            { position: 'absolute', top: rh(16), left: rw(16), backgroundColor: 'rgba(0,0,0,0.5)', padding: rw(8), borderRadius: rw(20) },
  titleOverlay:       { position: 'absolute', bottom: 0, left: 0, right: 0, padding: rw(20), backgroundColor: 'rgba(0,0,0,0.55)' },
  gameTitle:          { color: '#fff', fontSize: rf(22), fontWeight: '700', marginBottom: rh(6) },
  platformRow:        { flexDirection: 'row', alignItems: 'center', gap: rw(6) },
  platformLogo:       { width: rw(18), height: rw(18) },
  platformLabel:      { color: '#fff', fontSize: rf(13), textTransform: 'capitalize' },
  statsRow:           { flexDirection: 'row', gap: rw(10) },
  statCard:           { flex: 1, alignItems: 'center', paddingVertical: rh(14), paddingHorizontal: rw(8), borderRadius: rw(12), borderWidth: 1, gap: rh(4) },
  statValue:          { fontSize: rf(17), fontWeight: '700' },
  statLabel:          { fontSize: rf(11) },
  achLoading:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rw(10), paddingVertical: rh(16) },
  achLoadingText:     { fontSize: rf(14) },
  achCard:            { borderRadius: rw(14), borderWidth: 1, overflow: 'hidden' },
  achHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: rw(16), paddingBottom: rh(12) },
  achTitle:           { fontSize: rf(15), fontWeight: '700' },
  pill:               { paddingHorizontal: rw(10), paddingVertical: rh(5), borderRadius: rw(20), borderWidth: 1 },
  pillText:           { fontSize: rf(12) },
  achRow:             { flexDirection: 'row', alignItems: 'center', gap: rw(12), paddingHorizontal: rw(16), paddingVertical: rh(12), borderBottomWidth: 1 },
  achIcon:            { width: rw(44), height: rw(44), borderRadius: rw(8) },
  achIconPlaceholder: { width: rw(44), height: rw(44), borderRadius: rw(8), alignItems: 'center', justifyContent: 'center' },
  achInfo:            { flex: 1, gap: rh(2) },
  achName:            { fontSize: rf(13), fontWeight: '600' },
  achDesc:            { fontSize: rf(12) },
  achDate:            { fontSize: rf(11) },
});
