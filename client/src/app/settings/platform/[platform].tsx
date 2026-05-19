import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
import { platformApi } from '@/services/api';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { PLATFORM_LABELS, PLATFORM_LOGOS, normalizePlatformId } from '@/constants/platforms';
import type { PlatformId } from '@/constants/platforms';

const PLATFORM_CREDENTIAL_LABEL: Record<PlatformId, string> = {
  steam:  'Steam ID o URL de perfil',
  psn:    'NPSSO Token de PlayStation',
  xbox:   'XUID de Xbox Live',
};

const PLATFORM_CREDENTIAL_HINT: Record<PlatformId, string> = {
  steam:  'Ej: 76561198xxxxxxxxx o tu URL de perfil público',
  psn:    'Token de 64 caracteres obtenido desde las cookies de PSN',
  xbox:   'Ej: 2535xxxxxxxxxxxxxxx',
};

const PLATFORM_NAME_FULL: Record<PlatformId, string> = {
  steam:  'Steam',
  psn:    'PlayStation Network',
  xbox:   'Xbox Network',
};

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Hace un momento';
  if (mins < 60) return `Hace ${mins} minuto${mins > 1 ? 's' : ''}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} hora${hrs > 1 ? 's' : ''}`;
  const days = Math.floor(hrs / 24);
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
}

export default function PlatformGamesScreen() {
  const router = useRouter();
  const { platform } = useLocalSearchParams<{ platform: string }>();
  const platformId = normalizePlatformId(platform);
  const { colors } = useTheme();

  const [games, setGames] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [linkedAt, setLinkedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [credential, setCredential] = useState('');

  const load = async () => {
    if (!platformId) { setLoading(false); return; }
    try {
      const platRes = await platformApi.getLinkedPlatforms();
      const linkedPlatforms: any[] = (platRes.data as any)?.platforms || [];
      const found = linkedPlatforms.find(
        (p: any) => normalizePlatformId(p.platform || p.name) === platformId
      );
      if (found) {
        setConnected(true);
        setLinkedAt(found.linkedAt || null);
        try {
          const [statsRes, gamesRes] = await Promise.all([
            platformApi.getPlatformStats(platformId),
            platformApi.getPlatformGames(platformId),
          ]);
          setStats((statsRes.data as any)?.stats || statsRes.data || null);
          setGames((gamesRes.data as any)?.games || gamesRes.data || []);
        } catch {
          setStats(null); setGames([]);
        }
      } else {
        setConnected(false); setStats(null); setGames([]);
      }
    } catch {
      setConnected(false); setStats(null); setGames([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [platformId]);

  const handleLink = async () => {
    if (!platformId || !credential.trim()) return;
    setLinking(true);
    try {
      await platformApi.linkPlatform(platformId, credential.trim());
      setModalVisible(false);
      setCredential('');
      setLoading(true);
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.errors?.[0] || 'No se pudo vincular la plataforma';
      Alert.alert('Error al vincular', msg);
    } finally { setLinking(false); }
  };

  const handleUnlink = () => {
    if (!platformId) return;
    Alert.alert(
      `Desvincular ${PLATFORM_NAME_FULL[platformId] ?? platformId}`,
      'Perderás el acceso a tus juegos y estadísticas de esta plataforma.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desvincular', style: 'destructive', onPress: async () => {
          try {
            await platformApi.unlinkPlatform(platformId);
            setConnected(false); setStats(null); setGames([]); setLinkedAt(null);
          } catch { Alert.alert('Error', 'No se pudo desvincular'); }
        }},
      ]
    );
  };

  const platformLogo = platformId ? PLATFORM_LOGOS[platformId] : null;
  const platformLabel = platformId ? (PLATFORM_NAME_FULL[platformId] ?? PLATFORM_LABELS[platformId]) : (platform || 'Plataforma');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.backgroundGrad, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={rw(24)} color={colors.purple} />
        </TouchableOpacity>
        <View style={styles.platformInfo}>
          {platformLogo
            ? <Image source={platformLogo} style={{ width: rw(36), height: rw(36) }} resizeMode="contain" />
            : <MaterialIcons name="sports-esports" size={rw(30)} color={colors.purple} />}
          <View>
            <Text style={[styles.platformName, { color: colors.text }]}>{platformLabel}</Text>
            {!loading && (
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: connected ? '#22C55E' : colors.textMuted }]} />
                <Text style={{ color: connected ? '#22C55E' : colors.textMuted, fontSize: rf(13) }}>
                  {connected ? 'Conectado' : 'No conectado'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      ) : connected ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: rs.md, gap: rh(16) }}>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.infoCardTitle, { color: colors.text }]}>Información de la cuenta</Text>
            <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Estado</Text>
              <Text style={[styles.infoValue, { color: '#22C55E', fontWeight: '600' }]}>Conectado</Text>
            </View>
            {(stats?.totalGames !== undefined || stats?.gamesCount !== undefined || games.length > 0) && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Juegos sincronizados</Text>
                <Text style={[styles.infoValue, { color: colors.text, fontWeight: '600' }]}>
                  {stats?.totalGames ?? stats?.gamesCount ?? games.length}
                </Text>
              </View>
            )}
            {stats?.totalHours !== undefined && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Horas jugadas</Text>
                <Text style={[styles.infoValue, { color: colors.text, fontWeight: '600' }]}>{stats.totalHours}h</Text>
              </View>
            )}
            {linkedAt && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Última sincronización</Text>
                <Text style={[styles.infoValue, { color: colors.text, fontWeight: '600' }]}>{timeAgo(linkedAt)}</Text>
              </View>
            )}
          </View>

          {games.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Juegos ({games.length})</Text>
              {games.map((game: any, index: number) => {
                const pct = game.totalAchievements
                  ? Math.round((game.completedAchievements / game.totalAchievements) * 100) : 0;
                return (
                  <View key={game.id || index} style={[styles.gameRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    {(game.cover || game.imageUrl) ? (
                      <Image source={{ uri: game.cover || game.imageUrl }} style={styles.gameCover} resizeMode="cover" />
                    ) : (
                      <View style={[styles.gameCoverPlaceholder, { backgroundColor: colors.purpleDim }]}>
                        <MaterialIcons name="sports-esports" size={rw(24)} color={colors.purple} />
                      </View>
                    )}
                    <View style={styles.gameInfo}>
                      <Text style={[styles.gameName, { color: colors.text }]} numberOfLines={1}>{game.name || game.title}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: rf(12), marginTop: rh(4) }}>
                        {game.totalHours || game.playtime || 0}h jugadas
                      </Text>
                      {game.totalAchievements > 0 && (
                        <View style={{ marginTop: rh(6) }}>
                          <View style={[styles.progressBar, { backgroundColor: colors.purpleDim }]}>
                            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.purple }]} />
                          </View>
                          <Text style={{ color: colors.textMuted, fontSize: rf(11), marginTop: rh(2) }}>
                            {game.completedAchievements}/{game.totalAchievements} logros
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </>
          )}

          <TouchableOpacity style={[styles.unlinkButton, { borderColor: '#EF4444' }]} onPress={handleUnlink}>
            <MaterialIcons name="link-off" size={rw(18)} color="#EF4444" />
            <Text style={styles.unlinkText}>Desvincular {platformLabel}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.connectContainer}>
          <View style={[styles.connectIconCircle, { backgroundColor: colors.purpleDim }]}>
            {platformLogo
              ? <Image source={platformLogo} style={{ width: rw(60), height: rw(60) }} resizeMode="contain" />
              : <MaterialIcons name="sports-esports" size={rw(56)} color={colors.purple} />}
          </View>
          <Text style={[styles.connectTitle, { color: colors.text }]}>Conecta tu cuenta de {platformLabel}</Text>
          <Text style={[styles.connectSubtitle, { color: colors.textMuted }]}>
            Sincroniza tus juegos, horas jugadas y logros automáticamente
          </Text>
          <TouchableOpacity style={[styles.connectButton, { backgroundColor: colors.purple }]} onPress={() => setModalVisible(true)}>
            <MaterialIcons name="link" size={rw(18)} color="#fff" />
            <Text style={styles.connectButtonText}>Conectar {platformLabel}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Conectar {platformLabel}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setCredential(''); }}>
                <MaterialIcons name="close" size={rw(22)} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>
              {platformId ? PLATFORM_CREDENTIAL_LABEL[platformId] : 'Credencial'}
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.cardBorder, color: colors.text }]}
              placeholder={platformId ? PLATFORM_CREDENTIAL_HINT[platformId] : ''}
              placeholderTextColor={colors.textMuted}
              value={credential}
              onChangeText={setCredential}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={platformId === 'psn'}
            />
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.purple, opacity: (!credential.trim() || linking) ? 0.6 : 1 }]}
              onPress={handleLink}
              disabled={!credential.trim() || linking}
            >
              {linking
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.modalButtonText}>Vincular cuenta</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs.md, paddingVertical: rh(14), borderBottomWidth: 1, gap: rw(14) },
  backButton: { padding: rw(4) },
  platformInfo: { flexDirection: 'row', alignItems: 'center', gap: rw(14) },
  platformName: { fontSize: rf(18), fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: rw(6), marginTop: rh(2) },
  statusDot: { width: rw(8), height: rw(8), borderRadius: rw(4) },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  infoCard: { borderRadius: rw(14), borderWidth: 1, padding: rw(18), gap: rh(14) },
  infoCardTitle: { fontSize: rf(16), fontWeight: '700' },
  divider: { height: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: rf(14) },
  infoValue: { fontSize: rf(14) },
  sectionTitle: { fontSize: rf(16), fontWeight: '600' },
  gameRow: { flexDirection: 'row', alignItems: 'center', borderRadius: rw(12), borderWidth: 1, overflow: 'hidden' },
  gameCover: { width: rw(70), height: rw(70) },
  gameCoverPlaceholder: { width: rw(70), height: rw(70), alignItems: 'center', justifyContent: 'center' },
  gameInfo: { flex: 1, padding: rw(12) },
  gameName: { fontSize: rf(14), fontWeight: '600' },
  progressBar: { height: rh(4), borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  unlinkButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rw(8), padding: rh(14), borderRadius: rw(12), borderWidth: 1, marginTop: rh(8), marginBottom: rh(24) },
  unlinkText: { color: '#EF4444', fontWeight: '600', fontSize: rf(15) },
  connectContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: rw(32), gap: rh(20) },
  connectIconCircle: { width: rw(110), height: rw(110), borderRadius: rw(55), alignItems: 'center', justifyContent: 'center' },
  connectTitle: { fontSize: rf(20), fontWeight: '700', textAlign: 'center' },
  connectSubtitle: { fontSize: rf(14), textAlign: 'center', lineHeight: rh(22) },
  connectButton: { flexDirection: 'row', alignItems: 'center', gap: rw(8), paddingHorizontal: rw(28), paddingVertical: rh(14), borderRadius: rw(12) },
  connectButtonText: { color: '#fff', fontWeight: '700', fontSize: rf(15) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: rw(20), borderTopRightRadius: rw(20), borderWidth: 1, padding: rw(24), gap: rh(16) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: rf(18), fontWeight: '700' },
  modalLabel: { fontSize: rf(13), fontWeight: '500' },
  modalInput: { borderWidth: 1, borderRadius: rw(10), paddingHorizontal: rw(14), paddingVertical: rh(12), fontSize: rf(14) },
  modalButton: { borderRadius: rw(12), paddingVertical: rh(14), alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: '700', fontSize: rf(15) },
});
