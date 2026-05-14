// src/components/SearchBar.jsx
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { ms, fs, wp } from '../theme/responsive';

export function SearchBar({ value, onChangeText, onSubmit, placeholder = 'Buscar...', showCancel = false, onCancel, style }) {
  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.inputContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value?.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {showCancel && (
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:        { flexDirection: 'row', alignItems: 'center', gap: ms(10) },
  inputContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: ms(12),
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: wp(12), height: ms(46), gap: ms(8),
  },
  searchIcon:     { fontSize: fs(14) },
  input:          { flex: 1, color: colors.text, fontSize: fs(14), paddingVertical: 0 },
  clearIcon:      { color: colors.textMuted, fontSize: fs(12), padding: ms(4) },
  cancelBtn:      { paddingVertical: ms(4) },
  cancelText:     { color: colors.purpleLight, fontSize: fs(14), fontWeight: '500' },
});
