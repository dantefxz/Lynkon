import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { rw, rh, rf, rs } from '@/utils/responsive';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={[styles.logoBox, { backgroundColor: colors.purple, shadowColor: colors.purple }]}>
            <Image source={require('../../../assets/Logo.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={[styles.title, { color: colors.text, fontSize: rf(36) }]}>Lynkon</Text>
          <Text style={[styles.subtitle, { color: colors.purple, fontSize: rf(16) }]}>
            Tu plataforma de gaming unificada
          </Text>
        </View>
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.purple }]}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, { fontSize: rf(16) }]}>Iniciar sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
            onPress={() => router.push('/auth/register')}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text, fontSize: rf(16) }]}>Registrarse</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: rf(13) }}>
          Conecta todas tus plataformas favoritas
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs.xl,
  },
  logoSection: { alignItems: 'center', marginBottom: rh(64) },
  logoBox: {
    width: rw(96),
    height: rw(96),
    borderRadius: rw(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rh(24),
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {
    width: rw(56),
    height: rw(56),
  },
  title: { fontWeight: '700', marginBottom: rh(8) },
  subtitle: { textAlign: 'center' },
  buttonSection: { width: '100%', gap: rh(16), marginBottom: rh(64) },
  primaryButton: { paddingVertical: rh(16), borderRadius: rw(12), alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  secondaryButton: { paddingVertical: rh(16), borderRadius: rw(12), alignItems: 'center', borderWidth: 1 },
  secondaryButtonText: { fontWeight: '600' },
});
