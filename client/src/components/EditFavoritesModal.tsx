import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { useTheme } from '@/context/ThemeContext';

interface Game {
  id: string;
  name: string;
  cover?: string;
}

interface Props {
  visible: boolean;
  favorites: Game[];
  onReorder: (games: Game[]) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function EditFavoritesModal({ visible, favorites, onReorder, onRemove, onClose }: Props) {
  const { colors } = useTheme();
  const [list, setList] = useState<Game[]>(favorites);

  useEffect(() => {
    setList(favorites);
  }, [favorites]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...list];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setList(next);
    onReorder(next);
  };

  const moveDown = (index: number) => {
    if (index === list.length - 1) return;
    const next = [...list];
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
    setList(next);
    onReorder(next);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Editar favoritos</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={rw(24)} color={colors.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={[styles.row, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
              <MaterialIcons name="drag-handle" size={rw(22)} color={colors.textMuted} style={styles.drag} />
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => moveUp(index)} disabled={index === 0} style={styles.actionBtn}>
                  <MaterialIcons name="arrow-upward" size={rw(20)} color={index === 0 ? colors.cardBorder : colors.purple} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveDown(index)} disabled={index === list.length - 1} style={styles.actionBtn}>
                  <MaterialIcons name="arrow-downward" size={rw(20)} color={index === list.length - 1 ? colors.cardBorder : colors.purple} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.actionBtn}>
                  <MaterialIcons name="delete-outline" size={rw(20)} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              No tenés juegos favoritos todavía
            </Text>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs.md,
    paddingVertical: rh(16),
    borderBottomWidth: 1,
  },
  title: { fontSize: rf(18), fontWeight: '700' },
  closeBtn: { padding: rs.sm },
  list: { paddingHorizontal: rs.md, paddingTop: rh(8) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rw(10),
    borderBottomWidth: 1,
    paddingVertical: rh(12),
    paddingHorizontal: rs.md,
    marginBottom: rh(6),
  },
  drag: { marginRight: rs.sm },
  name: { flex: 1, fontSize: rf(14), fontWeight: '500' },
  actions: { flexDirection: 'row', gap: rw(4) },
  actionBtn: { padding: rw(6) },
  empty: { textAlign: 'center', marginTop: rh(48), fontSize: rf(14) },
});
