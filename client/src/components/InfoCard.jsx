// src/components/InfoCard.jsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { ms, fs, wp } from '../theme/responsive';

export function InfoCard({ logo, miniTitle, title, description, rightContent, onPress, style }) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container style={[styles.container, style]} onPress={onPress} activeOpacity={0.85}>
      {logo && (
        <View style={styles.logoContainer}>
          {typeof logo === 'string'
            ? <Image source={{ uri: logo }} style={styles.logo} />
            : logo}
        </View>
      )}
      <View style={styles.body}>
        {miniTitle && <Text style={styles.miniTitle}>{miniTitle}</Text>}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {description && <Text style={styles.description} numberOfLines={2}>{description}</Text>}
      </View>
      {rightContent && <View style={styles.right}>{rightContent}</View>}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: ms(14),
    borderWidth: 1, borderColor: colors.border, padding: ms(14), gap: ms(12),
  },
  logoContainer: {
    width: ms(48), height: ms(48), borderRadius: ms(12),
    backgroundColor: colors.purpleMuted, alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
  },
  logo:        { width: '100%', height: '100%' },
  body:        { flex: 1, gap: ms(2) },
  miniTitle:   { color: colors.textSecondary, fontSize: fs(11), fontWeight: '500' },
  title:       { color: colors.text, fontSize: fs(15), fontWeight: '600' },
  description: { color: colors.textMuted, fontSize: fs(12), lineHeight: fs(16), marginTop: ms(2) },
  right:       { alignItems: 'flex-end', justifyContent: 'center', flexShrink: 0 },
});
