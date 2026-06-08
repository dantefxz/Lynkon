import React, { useState } from 'react';
import {
  Modal, View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { useTheme } from '@/context/ThemeContext';

interface Game {
  id: string;
  name: string;
  cover: string;
  platform?: string;
}

interface Props {
  visible: boolean;
  platforms: string[];
  allGames: Game[];
  visibleIds: Set<string>;
  onToggle: (id: string) => void;
  onClose: () => void;
}

export function AddGameModal({ visible, allGames, visibleIds, onToggle, onClose }: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  const filtered = allGames.filter((g) =>
    g.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Agregar juego</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={rw(24)} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <MaterialIcons name="search" size={rw(20)} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar juego..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isSelected = visibleIds.has(item.id);
            return (
              <TouchableOpacity
                style={[styles.row, { borderBottomColor: colors.border }]}
                onPress={() => onToggle(item.id)}
              >
                <Text style={[styles.gameName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <MaterialIcons
                  name={isSelected ? 'check-circle' : 'add-circle-outline'}
                  size={rw(22)}
                  color={isSelected ? colors.purple : colors.textMuted}
                />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              No se encontraron juegos
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(8),
    margin: rs.md,
    borderRadius: rw(12),
    borderWidth: 1,
    paddingHorizontal: rs.md,
    paddingVertical: rh(4),
  },
  searchInput: { flex: 1, fontSize: rf(15), paddingVertical: rh(10) },
  list: { paddingHorizontal: rs.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rh(14),
    borderBottomWidth: 1,
  },
  gameName: { flex: 1, fontSize: rf(15), marginRight: rs.md },
  empty: { textAlign: 'center', marginTop: rh(48), fontSize: rf(14) },
});
