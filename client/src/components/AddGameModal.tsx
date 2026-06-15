import React, { useState, useMemo } from 'react';
import {
  View, Text, Modal, TouchableOpacity, FlatList,
  StyleSheet, TextInput, Switch, Image,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors } = useTheme();
  const { t } = useTranslation();
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

  const gamesInProfileLabel = selectedCount === 1
    ? t('addGameModal.gamesInProfile', { count: selectedCount })
    : t('addGameModal.gamesInProfilePlural', { count: selectedCount });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            {step === 'games' ? (
              <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="arrow-back" size={rw(20)} color={colors.text} />
              </TouchableOpacity>
            ) : (
              <View style={styles.backBtn} />
            )}
            <Text style={[styles.title, { color: colors.text }]}>
              {step === 'platform' ? (title || t('addGameModal.addToProfile')) : t('addGameModal.selectGames')}
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={rw(22)} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {step === 'platform' ? (
            <>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('addGameModal.selectPlatformHint')}</Text>
              <View style={styles.platformList}>
                {platforms.map((plat) => {
                  const id = normalizePlatformId(plat);
                  return (
                    <TouchableOpacity
                      key={plat}
                      style={[styles.platformRow, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
                      onPress={() => handlePlatformPress(plat)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.platformIcon, { backgroundColor: colors.purpleMuted }]}>
                        {id && PLATFORM_LOGOS[id] ? (
                          <Image source={PLATFORM_LOGOS[id]} style={styles.platformLogo} resizeMode="contain" />
                        ) : (
                          <MaterialIcons name="sports-esports" size={rw(22)} color={colors.purple} />
                        )}
                      </View>
                      <View style={styles.platformInfo}>
                        <Text style={[styles.platformName, { color: colors.text }]}>{id ? PLATFORM_LABELS[id] : plat}</Text>
                        <Text style={[styles.platformStatus, { color: colors.online }]}>{t('addGameModal.connected')}</Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={rw(20)} color={colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('addGameModal.activateGamesHint')}</Text>

              <View style={[styles.searchWrapper, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                <MaterialIcons name="search" size={rw(18)} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder={t('addGameModal.searchGames')}
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
                      style={[styles.gameRow, { borderBottomColor: colors.border }]}
                      onPress={() => onToggle(item.id)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: item.cover }} style={[styles.gameCover, { backgroundColor: colors.purpleMuted }]} />
                      <View style={styles.gameInfo}>
                        <Text style={[styles.gameName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.gameMeta, { color: colors.textMuted }]}>{t('platform.hoursPlayedShort', { hours: item.totalHours })}</Text>
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
                    <Text style={[styles.emptyGamesText, { color: colors.textMuted }]}>{t('addGameModal.noGamesOnPlatform')}</Text>
                  </View>
                }
              />

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textMuted }]}>{gamesInProfileLabel}</Text>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.purple }]} onPress={handleClose} activeOpacity={0.85}>
                  <Text style={[styles.addBtnText, { color: colors.text }]}>{t('common.done')}</Text>
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
  backBtn:       { width: rw(28), alignItems: 'flex-start' },
  title:         { fontSize: rf(17), fontWeight: '700' },
  subtitle:      { fontSize: rf(13), paddingHorizontal: rs.md, marginTop: rh(4), marginBottom: rh(16) },
  platformList:  { gap: rh(8), paddingHorizontal: rs.md, paddingBottom: rh(16) },
  platformRow:   { flexDirection: 'row', alignItems: 'center', gap: rw(12), borderRadius: rw(12), padding: rw(14), borderWidth: 1 },
  platformIcon:  { width: rw(40), height: rw(40), borderRadius: rw(10), alignItems: 'center', justifyContent: 'center' },
  platformLogo:  { width: rw(22), height: rw(22) },
  platformInfo:  { flex: 1 },
  platformName:  { fontSize: rf(14), fontWeight: '600' },
  platformStatus:{ fontSize: rf(12), marginTop: rh(2) },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: rw(10), marginHorizontal: rs.md, paddingHorizontal: rw(12), paddingVertical: rh(8), gap: rw(8), borderWidth: 1, marginBottom: rh(8) },
  searchInput:   { flex: 1, fontSize: rf(14), padding: 0 },
  gameList:      { maxHeight: rh(340), marginHorizontal: rs.md },
  gameRow:       { flexDirection: 'row', alignItems: 'center', gap: rw(12), paddingVertical: rh(12), borderBottomWidth: 1 },
  gameCover:     { width: rw(52), height: rw(52), borderRadius: rw(8) },
  gameInfo:      { flex: 1 },
  gameName:      { fontSize: rf(14), fontWeight: '600' },
  gameMeta:      { fontSize: rf(12), marginTop: rh(2) },
  emptyGames:    { alignItems: 'center', gap: rh(8), paddingVertical: rh(32) },
  emptyGamesText:{ fontSize: rf(13) },
  footer:        { paddingHorizontal: rs.md, paddingTop: rh(16), gap: rh(12) },
  footerText:    { fontSize: rf(13), textAlign: 'center' },
  addBtn:        { borderRadius: rw(12), paddingVertical: rh(14), alignItems: 'center' },
  addBtnText:    { fontSize: rf(15), fontWeight: '700' },
});
