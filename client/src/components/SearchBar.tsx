/**
 * SearchBar
 * ---------
 * Barra de búsqueda con ícono, input y botón de limpiar.
 * Usado en: social (buscar usuarios), platform detail (buscar juegos).
 */
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { rw, rh, rf } from '@/utils/responsive';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({
  value, onChangeText, placeholder = 'Buscar...',
  onClear, autoFocus = false,
}: SearchBarProps) {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name="search-outline" size={rw(18)} color={colors.textMuted} style={styles.icon} />

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={rw(18)} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rw(12),
    borderWidth: 1,
    paddingHorizontal: rw(14),
    paddingVertical: rh(10),
    gap: rw(10),
  },
  icon: {},
  input: {
    flex: 1,
    color: colors.text,
    fontSize: rf(15),
    padding: 0,
  },
});
