import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { authApi } from '@/services/api';
import { rw, rh, rf, rs } from '@/utils/responsive';

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError(t('auth.forgotPassword.errorEmpty')); return; }
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(trimmed);
    } catch {
      // backend responds 200 for security; ignore network errors
    } finally {
      setLoading(false);
      onSent(trimmed);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={rw(24)} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: rf(20) }]}>{t('auth.forgotPassword.title')}</Text>
      </View>
      <View style={styles.form}>
        <Text style={{ color: colors.textMuted, fontSize: rf(14), lineHeight: rh(22) }}>
          {t('auth.forgotPassword.description')}
        </Text>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>{t('auth.forgotPassword.email')}</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <MaterialIcons name="mail-outline" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text, fontSize: rf(15) }]}
              placeholder="tu@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              onSubmitEditing={handleSubmit}
            />
          </View>
          {error ? <Text style={{ color: '#EF4444', fontSize: rf(12) }}>{error}</Text> : null}
        </View>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.purple, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={[styles.buttonText, { fontSize: rf(16) }]}>{t('auth.forgotPassword.submit')}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SentStep({ email }: { email: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.replace('/auth/login')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={rw(24)} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: rf(20) }]}>{t('auth.forgotPassword.sentTitle')}</Text>
      </View>

      <View style={[styles.form, { alignItems: 'center' }]}>
        <View style={[styles.iconCircle, { backgroundColor: colors.purpleDim }]}>
          <MaterialIcons name="mark-email-read" size={rw(52)} color={colors.purple} />
        </View>

        <Text style={[styles.sentTitle, { color: colors.text, fontSize: rf(20) }]}>
          {t('auth.forgotPassword.sentHeader')}
        </Text>

        <View style={[styles.sentBanner, { backgroundColor: colors.purpleDim }]}>
          <MaterialIcons name="mail-outline" size={rw(18)} color={colors.purple} />
          <Text style={[styles.sentText, { color: colors.purple, fontSize: rf(13) }]}>
            {t('auth.forgotPassword.sentBanner')} <Text style={{ fontWeight: '700' }}>{email}</Text>
          </Text>
        </View>

        <Text style={{ color: colors.textMuted, fontSize: rf(13), textAlign: 'center', lineHeight: rh(20) }}>
          {t('auth.forgotPassword.sentBody')}
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.purple }]}
          onPress={() => router.replace('/auth/login')}
        >
          <Text style={[styles.buttonText, { fontSize: rf(16) }]}>{t('auth.forgotPassword.backToLogin')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [email, setEmail] = useState('');

  if (step === 'sent') return <SentStep email={email} />;

  return <EmailStep onSent={(e) => { setEmail(e); setStep('sent'); }} />;
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs.md, paddingVertical: rh(14), borderBottomWidth: 1 },
  backButton:  { padding: rs.sm, marginRight: rs.sm },
  headerTitle: { fontWeight: '600' },
  form:        { padding: rs.xl, gap: rh(20) },
  field:       { gap: rh(8) },
  label:       { fontWeight: '500' },
  inputRow:    { flexDirection: 'row', alignItems: 'center', borderRadius: rw(12), borderWidth: 1, paddingHorizontal: rs.md, paddingVertical: rh(4) },
  inputIcon:   { marginRight: rs.md },
  input:       { flex: 1, paddingVertical: rh(12) },
  sentBanner:  { flexDirection: 'row', alignItems: 'center', gap: rw(10), padding: rs.md, borderRadius: rw(12) },
  sentText:    { flex: 1, lineHeight: rh(20) },
  sentTitle:   { fontWeight: '700', textAlign: 'center' as const, marginTop: rh(8) },
  iconCircle:  { width: rw(100), height: rw(100), borderRadius: rw(50), alignItems: 'center' as const, justifyContent: 'center' as const },
  button:      { paddingVertical: rh(16), borderRadius: rw(12), alignItems: 'center' as const, width: '100%' as any },
  buttonText:  { color: '#fff', fontWeight: '600' },
});
