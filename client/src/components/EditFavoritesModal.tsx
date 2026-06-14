import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, StyleSheet } from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
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
  const { colors } = useTheme();
  const [list, setList] = useState<Game[]>([]);

  React.useEffect(() => {
    if (visible) setList([...favorites]);
  }, [visible, favorites]);

  const remove = (id: string) => setList((prev) => prev.filter((g) => g.id !== id));

  const handleDone = () => {
    const originalIds  = new Set(favorites.map((g) => g.id));
    const remainingIds = new Set(list.map((g) => g.id));
    [...originalIds].filter((id) => !remainingIds.has(id)).forEach((id) => onRemove(id));
    onReorder(list);
    onClose();
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Game>) => (
    <ScaleDecorator>
      <View style={[
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border },
        isActive && { borderColor: colors.purple, opacity: 0.9, elevation: 8, shadowColor: colors.purple, shadowOpacity: 0.3, shadowRadius: 8 },
      ]}>
        <TouchableOpacity
          onPressIn={drag}
          style={styles.dragHandle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="drag-indicator" size={rw(22)} color={colors.textMuted} />
        </TouchableOpacity>

        <Image source={{ uri: item.cover }} style={[styles.cover, { backgroundColor: colors.purpleMuted }]} resizeMode="cover" />

        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.hours, { color: colors.textMuted }]}>{item.totalHours}h jugadas</Text>
        </View>

        <TouchableOpacity
          onPress={() => remove(item.id)}
          style={styles.removeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={rw(18)} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </ScaleDecorator>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <GestureHandlerRootView style={[styles.sheet, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Mis Favoritos ({list.length})</Text>
            <TouchableOpacity style={[styles.donePill, { backgroundColor: colors.purple }]} onPress={handleDone} activeOpacity={0.8}>
              <MaterialIcons name="check" size={rw(15)} color={colors.text} />
              <Text style={[styles.pillText, { color: colors.text }]}>Listo</Text>
            </TouchableOpacity>
          </View>

          <DraggableFlatList
            data={list}
            keyExtractor={(item) => item.id}
            onDragEnd={({ data }) => setList(data)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        </GestureHandlerRootView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
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
  },
  title: {
    fontSize: rf(16),
    fontWeight: '700',
  },
  donePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(4),
    borderRadius: rw(20),
    paddingHorizontal: rw(12),
    paddingVertical: rh(6),
  },
  pillText: {
    fontSize: rf(13),
    fontWeight: '600',
  },
  listContent: {
    padding: rs.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rw(12),
    borderWidth: 1,
    paddingVertical: rh(10),
    paddingHorizontal: rw(10),
    gap: rw(10),
    marginBottom: rh(8),
  },
  dragHandle: {
    paddingHorizontal: rw(2),
  },
  cover: {
    width: rw(50),
    height: rw(50),
    borderRadius: rw(8),
  },
  info: {
    flex: 1,
    gap: rh(3),
  },
  name: {
    fontSize: rf(14),
    fontWeight: '600',
  },
  hours: {
    fontSize: rf(12),
  },
  removeBtn: {
    paddingHorizontal: rw(2),
  },
});
