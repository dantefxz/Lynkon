import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { AppButton } from '@/components';
import { track, identify } from '@/services/analytics';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { Alert.alert(t('common.error'), t('auth.login.errorEmpty')); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
      track('login', { method: 'email' });
    } catch (err: any) {
      track('login_failed', { reason: err?.response?.data?.message || 'unknown' });
      Alert.alert(t('common.error'), err?.response?.data?.message || t('auth.login.errorInvalid'));
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={rw(24)} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('auth.login.title')}</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.purple }]}>{t('auth.login.email')}</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <MaterialIcons name="mail-outline" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
                <TextInput style={[styles.input, { color: colors.text }]} placeholder={t('auth.login.emailPlaceholder')} placeholderTextColor={colors.textMuted}
                  value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.purple }]}>{t('auth.login.password')}</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <MaterialIcons name="lock-outline" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
                <TextInput style={[styles.input, { color: colors.text }]} placeholder="••••••••" placeholderTextColor={colors.textMuted}
                  value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={rw(20)} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/auth/forgot-password')} style={{ alignSelf: 'flex-end' }}>
              <Text style={{ color: colors.purple, fontSize: rf(14) }}>{t('auth.login.forgotPass')}</Text>
            </TouchableOpacity>
            <AppButton label={t('auth.login.submit')} onPress={handleLogin} loading={loading} />
            <View style={styles.registerRow}>
              <Text style={{ color: colors.textMuted, fontSize: rf(14) }}>{t('auth.login.noAccount')} </Text>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Text style={{ color: colors.purple, fontSize: rf(14), fontWeight: '600' }}>{t('auth.login.register')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs.md, paddingVertical: rh(14), borderBottomWidth: 1 },
  backButton: { padding: rs.sm, marginRight: rs.sm },
  headerTitle: { fontSize: rf(20), fontWeight: '600' },
  form: { padding: rs.xl, gap: rh(18) },
  field: { gap: rh(8) },
  label: { fontSize: rf(14), fontWeight: '500' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: rw(12), borderWidth: 1, paddingHorizontal: rs.md, paddingVertical: rh(4) },
  inputIcon: { marginRight: rs.md },
  input: { flex: 1, fontSize: rf(15), paddingVertical: rh(12) },
  eyeButton: { padding: rs.sm },
  registerRow: { flexDirection: 'row', justifyContent: 'center' },
});