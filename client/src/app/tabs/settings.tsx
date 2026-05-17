import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { platformApi } from '@/services/api';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { colors } from '@/theme/colors';
import { SettingsRow, SettingsSwitchRow, AppButton } from '@/components';
import {
  PLATFORM_LABELS,
  PLATFORM_LOGOS,
  PLATFORM_ORDER,
  type PlatformId,
  normalizePlatformId,
} from '@/constants/platforms';

interface LinkedPlatform {
  id: PlatformId;
  connected: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [platforms, setPlatforms] = useState<LinkedPlatform[]>(
    PLATFORM_ORDER.map((id) => ({ id, connected: false }))
  );
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await platformApi.getLinkedPlatforms();
        const linked = new Set(
          (res.data || [])
            .map((p: any) => normalizePlatformId(p.platform || p.name))
            .filter(Boolean)
        );

        setPlatforms(PLATFORM_ORDER.map((id) => ({ id, connected: linked.has(id) })));
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardAlt }]}>
          <Text style={styles.title}>Configuración</Text>
        </View>

        <View style={styles.content}>
          {/* Cuenta — SettingsRow component */}
          <Text style={styles.sectionLabel}>CUENTA</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsRow
              icon="person-outline"
              label="Editar perfil"
              value={user?.name || ''}
              onPress={() => router.push('/settings/edit-profile')}
              showDivider
            />
            <SettingsRow
              icon="lock-closed-outline"
              label="Cambiar contraseña"
              onPress={() => router.push('/settings/change-password')}
            />
          </View>

          {/* Apariencia — SettingsSwitchRow component */}
          <Text style={styles.sectionLabel}>APARIENCIA</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsSwitchRow
              icon={darkMode ? 'moon-outline' : 'sunny-outline'}
              label={`Modo ${darkMode ? 'oscuro' : 'luminoso'}`}
              value={darkMode}
              onValueChange={setDarkMode}
            />
          </View>

          {/* Plataformas — SettingsRow component */}
          <Text style={styles.sectionLabel}>PLATAFORMAS</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.purple} />
              </View>
            ) : (
              platforms.map((platform, index) => (
                <SettingsRow
                  key={platform.id}
                  iconImage={PLATFORM_LOGOS[platform.id]}
                  iconBg={colors.purpleMuted}
                  label={PLATFORM_LABELS[platform.id]}
                  value={platform.connected ? '● Conectado' : 'No conectado'}
                  onPress={() => router.push(`/settings/platform/${platform.id}`)}
                  showDivider={index < platforms.length - 1}
                />
              ))
            )}
          </View>

          {/* Cerrar sesión — AppButton component */}
          <AppButton
            label="Cerrar sesión"
            icon="log-out-outline"
            variant="destructive"
            onPress={() => setShowLogoutConfirm(true)}
          />
        </View>
      </ScrollView>

      {/* Confirmación logout */}
      {showLogoutConfirm && (
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.dialogTitle}>¿Cerrar sesión?</Text>
            <Text style={styles.dialogMsg}>
              Vas a tener que volver a iniciar sesión para acceder a tu cuenta.
            </Text>
            <View style={styles.dialogBtns}>
              <AppButton label="Cancelar" variant="secondary" onPress={() => setShowLogoutConfirm(false)} style={{ flex: 1 }} />
              <AppButton label="Cerrar sesión" variant="destructive" onPress={logout} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: rs.md, paddingBottom: rh(20) },
  title: { color: colors.text, fontSize: rf(24), fontWeight: '700' },
  content: { padding: rs.md, gap: rh(8) },
  sectionLabel: { color: colors.textMuted, fontSize: rf(11), fontWeight: '700', letterSpacing: 1, marginTop: rh(8), paddingHorizontal: rw(4) },
  card: { borderRadius: rw(16), borderWidth: 1, overflow: 'hidden', marginTop: rh(6) },
  loadingRow: { padding: rh(20), alignItems: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  dialog: { margin: rs.xl, borderRadius: rw(16), padding: rw(24), borderWidth: 1, gap: rh(16) },
  dialogTitle: { color: colors.text, fontSize: rf(18), fontWeight: '700' },
  dialogMsg: { color: colors.textMuted, fontSize: rf(14), lineHeight: rh(20) },
  dialogBtns: { flexDirection: 'row', gap: rw(12) },
});
