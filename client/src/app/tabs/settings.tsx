import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { platformApi } from '@/services/api';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { SettingsRow, SettingsSwitchRow, AppButton } from '@/components';
import {
  PLATFORM_LABELS, PLATFORM_LOGOS, PLATFORM_ORDER,
  type PlatformId, normalizePlatformId,
} from '@/constants/platforms';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type SupportedLanguage } from '@/i18n';

interface LinkedPlatform { id: PlatformId; connected: boolean; }

export default function SettingsScreen() {
  const router  = useRouter();
  const { t }   = useTranslation();
  const { logout, user } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const { language, setLanguage } = useLanguage();

  const [platforms, setPlatforms] = useState<LinkedPlatform[]>(
    PLATFORM_ORDER.map((id) => ({ id, connected: false }))
  );
  const [loading, setLoading]               = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const res = await platformApi.getLinkedPlatforms();
          const linked = new Set(
            ((res.data as any)?.platforms || [])
              .map((p: any) => normalizePlatformId(p.platform || p.name))
              .filter(Boolean)
          );
          setPlatforms(PLATFORM_ORDER.map((id) => ({ id, connected: linked.has(id) })));
        } catch {} finally { setLoading(false); }
      };
      load();
    }, [])
  );

  const isDark = theme === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.cardAlt }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
        </View>

        <View style={styles.content}>
          {/* Cuenta */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            {t('settings.sections.account')}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsRow
              icon="person-outline"
              label={t('settings.account.editProfile')}
              value={user?.name || ''}
              onPress={() => router.push('/settings/edit-profile')}
              showDivider
            />
            <SettingsRow
              icon="lock-outline"
              label={t('settings.account.changePassword')}
              onPress={() => router.push('/settings/change-password')}
            />
          </View>

          {/* Apariencia */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            {t('settings.sections.appearance')}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsSwitchRow
              icon={isDark ? 'dark-mode' : 'light-mode'}
              label={isDark ? t('settings.appearance.darkMode') : t('settings.appearance.lightMode')}
              value={isDark}
              onValueChange={toggleTheme}
            />
          </View>

          {/* Idioma */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            {t('settings.sections.language')}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsRow
              icon="language"
              label={t('settings.language.label')}
              value={LANGUAGE_LABELS[language]}
              onPress={() => setShowLangPicker(true)}
            />
          </View>

          {/* Plataformas */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            {t('settings.sections.platforms')}
          </Text>
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
                  value={platform.connected
                    ? t('settings.platforms.connected')
                    : t('settings.platforms.notConnected')}
                  onPress={() => router.push(`/settings/platform/${platform.id}`)}
                  showDivider={index < platforms.length - 1}
                />
              ))
            )}
          </View>

          {/* Cerrar sesión */}
          <AppButton
            label={t('settings.logout.button')}
            icon="logout"
            variant="destructive"
            onPress={() => setShowLogoutConfirm(true)}
          />
        </View>
      </ScrollView>

      {/* Confirmación logout */}
      {showLogoutConfirm && (
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>{t('settings.logout.title')}</Text>
            <Text style={[styles.dialogMsg, { color: colors.textMuted }]}>{t('settings.logout.message')}</Text>
            <View style={styles.dialogBtns}>
              <AppButton
                label={t('common.cancel')}
                variant="secondary"
                onPress={() => setShowLogoutConfirm(false)}
                style={{ flex: 1 }}
              />
              <AppButton
                label={t('settings.logout.confirm')}
                variant="destructive"
                onPress={logout}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      )}

      {/* Selector de idioma */}
      <Modal
        visible={showLangPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangPicker(false)}
      >
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>
              {t('settings.language.picker')}
            </Text>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.langOption,
                  { borderColor: colors.border },
                  language === lang && { backgroundColor: colors.purpleMuted, borderColor: colors.purple },
                ]}
                onPress={async () => { await setLanguage(lang as SupportedLanguage); setShowLangPicker(false); }}
              >
                <Text style={[styles.langLabel, { color: colors.text }]}>
                  {LANGUAGE_LABELS[lang as SupportedLanguage]}
                </Text>
                {language === lang && (
                  <MaterialIcons name="check" size={rw(18)} color={colors.purple} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowLangPicker(false)} style={styles.langCancel}>
              <Text style={{ color: colors.textMuted, fontSize: rf(14) }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { padding: rs.md, paddingBottom: rh(20) },
  title:        { fontSize: rf(24), fontWeight: '700' },
  content:      { padding: rs.md, gap: rh(8) },
  sectionLabel: { fontSize: rf(11), fontWeight: '700', letterSpacing: 1, marginTop: rh(8), paddingHorizontal: rw(4) },
  card:         { borderRadius: rw(16), borderWidth: 1, overflow: 'hidden', marginTop: rh(6) },
  loadingRow:   { padding: rh(20), alignItems: 'center' },
  overlay:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  dialog:       { margin: rs.xl, borderRadius: rw(16), padding: rw(24), borderWidth: 1, gap: rh(16), width: '85%' },
  dialogTitle:  { fontSize: rf(18), fontWeight: '700' },
  dialogMsg:    { fontSize: rf(14), lineHeight: rh(20) },
  dialogBtns:   { flexDirection: 'row', gap: rw(12) },
  langOption:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rh(14), paddingHorizontal: rw(16), borderRadius: rw(12), borderWidth: 1 },
  langLabel:    { fontSize: rf(15), fontWeight: '500' },
  langCancel:   { alignItems: 'center', paddingTop: rh(4) },
});
