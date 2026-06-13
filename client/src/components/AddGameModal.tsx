import React, { useState, useMemo } from 'react';
import {
  View, Text, Modal, TouchableOpacity, FlatList,
  StyleSheet, TextInput, Switch, Image,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors } from '@/theme/colors';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { PLATFORM_LABELS, PLATFORM_LOGOS, normalizePlatformId, PlatformId } from '@/constants/platforms';

interface Game {
  id: string;
  name: string;
  cover: string;
  totalHours: number;
  totalAchievements: number;
  completedAchievements: number;
  platforms: { name: string }[];
}

interface Props {
  visible: boolean;
  platforms: string[];
  allGames: Game[];
  visibleIds: Set<string>;
  onToggle: (id: string) => void;
  onClose: () => void;
  title?: string;
}

export function AddGameModal({ visible, platforms, allGames, visibleIds, onToggle, onClose, title }: Props) {
  const [step, setStep] = useState<'platform' | 'games'>('platform');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const platformGames = useMemo(() => {
    if (!selectedPlatform) return [];
    return allGames
      .filter((g) => g.platforms.some((p) => p.name.toLowerCase() === selectedPlatform.toLowerCase()))
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [allGames, selectedPlatform]);

  const filteredGames = useMemo(() => {
    if (!search.trim()) return platformGames;
    return platformGames.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
  }, [platformGames, search]);

  const selectedCount = filteredGames.filter((g) => visibleIds.has(g.id)).length;

  const handlePlatformPress = (plat: string) => {
    setSelectedPlatform(plat);
    setSearch('');
    setStep('games');
  };

  const handleBack = () => {
    setStep('platform');
    setSelectedPlatform(null);
    setSearch('');
  };

  const handleClose = () => {
    setStep('platform');
    setSelectedPlatform(null);
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            {step === 'games' ? (
              <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="arrow-back" size={rw(20)} color={colors.text} />
              </TouchableOpacity>
            ) : (
              <View style={styles.backBtn} />
            )}
            <Text style={styles.title}>
              {step === 'platform' ? (title || 'Añadir a Mi Perfil') : 'Seleccionar Juegos'}
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={rw(22)} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {step === 'platform' ? (
            <>
              <Text style={styles.subtitle}>Elegí de qué plataforma querés mostrar juegos</Text>
              <View style={styles.platformList}>
                {platforms.map((plat) => {
                  const id = normalizePlatformId(plat);
                  return (
                    <TouchableOpacity
                      key={plat}
                      style={styles.platformRow}
                      onPress={() => handlePlatformPress(plat)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.platformIcon}>
                        {id && PLATFORM_LOGOS[id] ? (
                          <Image source={PLATFORM_LOGOS[id]} style={styles.platformLogo} resizeMode="contain" />
                        ) : (
                          <MaterialIcons name="sports-esports" size={rw(22)} color={colors.purple} />
                        )}
                      </View>
                      <View style={styles.platformInfo}>
                        <Text style={styles.platformName}>{id ? PLATFORM_LABELS[id] : plat}</Text>
                        <Text style={styles.platformStatus}>Conectado</Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={rw(20)} color={colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>Activá los juegos que querés mostrar en tu perfil</Text>

              {/* Buscador */}
              <View style={styles.searchWrapper}>
                <MaterialIcons name="search" size={rw(18)} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar juegos..."
                  placeholderTextColor={colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <FlatList
                data={filteredGames}
                keyExtractor={(item) => item.id}
                style={styles.gameList}
                showsVerticalScrollIndicator
                renderItem={({ item }) => {
                  const pct = item.totalAchievements > 0
                    ? Math.round((item.completedAchievements / item.totalAchievements) * 100)
                    : 0;
                  const isVisible = visibleIds.has(item.id);

                  return (
                    <TouchableOpacity
                      style={styles.gameRow}
                      onPress={() => onToggle(item.id)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: item.cover }} style={styles.gameCover} />
                      <View style={styles.gameInfo}>
                        <Text style={styles.gameName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.gameMeta}>{item.totalHours}h jugadas</Text>
                      </View>
                      <Switch
                        value={isVisible}
                        onValueChange={() => onToggle(item.id)}
                        trackColor={{ false: colors.purpleMuted, true: colors.purple }}
                        thumbColor={colors.text}
                      />
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyGames}>
                    <MaterialIcons name="videogame-asset-off" size={rw(32)} color={colors.textMuted} />
                    <Text style={styles.emptyGamesText}>No hay juegos en esta plataforma</Text>
                  </View>
                }
              />

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>{selectedCount} juego{selectedCount !== 1 ? 's' : ''} en tu perfil</Text>
                <TouchableOpacity style={styles.addBtn} onPress={handleClose} activeOpacity={0.85}>
                  <Text style={styles.addBtnText}>Listo</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: rw(24),
    borderTopRightRadius: rw(24),
    paddingBottom: rh(32),
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs.md,
    paddingTop: rh(20),
    paddingBottom: rh(4),
  },
  backBtn: {
    width: rw(28),
    alignItems: 'flex-start',
  },
  title: {
    color: colors.text,
    fontSize: rf(17),
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: rf(13),
    paddingHorizontal: rs.md,
    marginTop: rh(4),
    marginBottom: rh(16),
  },
  platformList: {
    gap: rh(8),
    paddingHorizontal: rs.md,
    paddingBottom: rh(16),
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(12),
    backgroundColor: colors.cardAlt,
    borderRadius: rw(12),
    padding: rw(14),
    borderWidth: 1,
    borderColor: colors.border,
  },
  platformIcon: {
    width: rw(40),
    height: rw(40),
    borderRadius: rw(10),
    backgroundColor: colors.purpleMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformLogo: {
    width: rw(22),
    height: rw(22),
  },
  platformInfo: { flex: 1 },
  platformName: {
    color: colors.text,
    fontSize: rf(14),
    fontWeight: '600',
  },
  platformStatus: {
    color: colors.online,
    fontSize: rf(12),
    marginTop: rh(2),
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: rw(10),
    marginHorizontal: rs.md,
    paddingHorizontal: rw(12),
    paddingVertical: rh(8),
    gap: rw(8),
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: rh(8),
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: rf(14),
    padding: 0,
  },
  gameList: {
    maxHeight: rh(340),
    marginHorizontal: rs.md,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(12),
    paddingVertical: rh(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gameCover: {
    width: rw(52),
    height: rw(52),
    borderRadius: rw(8),
    backgroundColor: colors.purpleMuted,
  },
  gameInfo: { flex: 1 },
  gameName: {
    color: colors.text,
    fontSize: rf(14),
    fontWeight: '600',
  },
  gameMeta: {
    color: colors.textMuted,
    fontSize: rf(12),
    marginTop: rh(2),
  },
  emptyGames: {
    alignItems: 'center',
    gap: rh(8),
    paddingVertical: rh(32),
  },
  emptyGamesText: {
    color: colors.textMuted,
    fontSize: rf(13),
  },
  footer: {
    paddingHorizontal: rs.md,
    paddingTop: rh(16),
    gap: rh(12),
  },
  footerText: {
    color: colors.textMuted,
    fontSize: rf(13),
    textAlign: 'center',
  },
  addBtn: {
    backgroundColor: colors.purple,
    borderRadius: rw(12),
    paddingVertical: rh(14),
    alignItems: 'center',
  },
  addBtnText: {
    color: colors.text,
    fontSize: rf(15),
    fontWeight: '700',
  },
});
