/**
 * EditFavoritesModal
 * ------------------
 * Modal para reordenar y eliminar juegos favoritos.
 * Cada ítem tiene un botón de arrastre (⠿) y uno de eliminación (×).
 * Como RN no incluye DnD nativo, usamos simple up/down buttons.
 */
import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity,
  FlatList, Image, StyleSheet,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors } from '@/theme/colors';
import { rw, rh, rf, rs } from '@/utils/responsive';

interface Game {
  id: string;
  name: string;
  cover: string;
  totalHours: number;
  completedAchievements: number;
  totalAchievements: number;
}

interface Props {
  visible: boolean;
  favorites: Game[];
  onReorder: (reordered: Game[]) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function EditFavoritesModal({ visible, favorites, onReorder, onRemove, onClose }: Props) {
  const [list, setList] = useState<Game[]>([]);

  // Sync local list when modal opens
  React.useEffect(() => {
    if (visible) setList([...favorites]);
  }, [visible, favorites]);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...list];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setList(next);
  };

  const remove = (id: string) => {
    setList((prev) => prev.filter((g) => g.id !== id));
  };

  const handleDone = () => {
    onReorder(list);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Mis Favoritos ({list.length})</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.addPill} onPress={onClose} activeOpacity={0.8}>
                <MaterialIcons name="add" size={rw(15)} color={colors.text} />
                <Text style={styles.pillText}>Añadir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.donePill} onPress={handleDone} activeOpacity={0.8}>
                <MaterialIcons name="check" size={rw(15)} color={colors.text} />
                <Text style={styles.pillText}>Listo</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => {
              const pct = item.totalAchievements > 0
                ? Math.round((item.completedAchievements / item.totalAchievements) * 100)
                : 0;
              return (
                <View style={styles.gameCard}>
                  {/* Cover with overlay */}
                  <Image source={{ uri: item.cover }} style={styles.cover} blurRadius={2} />
                  <View style={styles.cardOverlay} />

                  {/* Action buttons */}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.dragBtn}
                      onPress={() => move(index, -1)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <MaterialIcons name="drag-indicator" size={rw(18)} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => remove(item.id)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <MaterialIcons name="close" size={rw(18)} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Name at bottom */}
                  <View style={styles.nameRow}>
                    <Text style={styles.gameName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.gamePct}>{pct}%</Text>
                  </View>
                </View>
              );
            }}
            numColumns={2}
            columnWrapperStyle={styles.row}
          />
        </View>
      </View>
    </Modal>
  );
}

const CARD_W = (rw(375 - 32 - 12)) / 2;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: rw(24),
    borderTopRightRadius: rw(24),
    paddingBottom: rh(40),
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs.md,
    paddingVertical: rh(18),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: rf(16),
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: rw(8),
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(4),
    backgroundColor: colors.purpleMuted,
    borderRadius: rw(20),
    paddingHorizontal: rw(12),
    paddingVertical: rh(6),
    borderWidth: 1,
    borderColor: colors.purpleBorder,
  },
  donePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(4),
    backgroundColor: colors.purple,
    borderRadius: rw(20),
    paddingHorizontal: rw(12),
    paddingVertical: rh(6),
  },
  pillText: {
    color: colors.text,
    fontSize: rf(13),
    fontWeight: '600',
  },
  listContent: {
    padding: rs.md,
    gap: rh(12),
  },
  row: {
    gap: rw(12),
    marginBottom: rh(12),
  },
  gameCard: {
    width: CARD_W,
    height: CARD_W * 1.4,
    borderRadius: rw(16),
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actions: {
    position: 'absolute',
    top: rw(10),
    left: rw(10),
    right: rw(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dragBtn: {
    backgroundColor: colors.purple,
    borderRadius: rw(10),
    padding: rw(8),
  },
  removeBtn: {
    backgroundColor: '#EF4444',
    borderRadius: rw(10),
    padding: rw(8),
  },
  nameRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: rw(10),
  },
  gameName: {
    color: colors.text,
    fontSize: rf(13),
    fontWeight: '600',
  },
  gamePct: {
    color: colors.textMuted,
    fontSize: rf(11),
    marginTop: rh(2),
  },
});
