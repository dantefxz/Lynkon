import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
import { rw, rh, rf } from '@/utils/responsive';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  onSearch?: () => void;
}

export function SearchBar({
  value, onChangeText, placeholder = 'Buscar...',
  onClear, autoFocus = false, onSearch,
}: SearchBarProps) {
  const { colors } = useTheme();

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  const canSearch = !!onSearch && value.length >= 2;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {onSearch ? (
        <TouchableOpacity
          onPress={canSearch ? onSearch : undefined}
          disabled={!canSearch}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="search" size={rw(18)} color={canSearch ? colors.purple : colors.textMuted} style={styles.icon} />
        </TouchableOpacity>
      ) : (
        <MaterialIcons name="search" size={rw(18)} color={colors.textMuted} style={styles.icon} />
      )}

      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={onSearch}
      />

      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="cancel" size={rw(18)} color={colors.textMuted} />
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
    fontSize: rf(15),
    padding: 0,
  },
});
