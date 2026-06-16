import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { generateUsername } from '@/utils/usernameGenerator';
import { track } from '@/services/analytics';

interface PasswordRule {
  key: string;
  labelKey: string;
  check: (p: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { key: 'minLength',  labelKey: 'auth.register.requirements.minLength',  check: (p) => p.length >= 8 },
  { key: 'minLetters', labelKey: 'auth.register.requirements.minLetters', check: (p) => (p.match(/[a-zA-Z]/g) || []).length >= 6 },
  { key: 'minNumbers', labelKey: 'auth.register.requirements.minNumbers', check: (p) => (p.match(/[0-9]/g) || []).length >= 2 },
];

function usePasswordValidation(password: string) {
  return useMemo(() => {
    const results = PASSWORD_RULES.map((rule) => ({
      ...rule,
      passed: rule.check(password),
    }));
    return { results, allPassed: results.every((r) => r.passed) };
  }, [password]);
}

function formatDisplay(date: Date): string {
  const dd   = String(date.getDate()).padStart(2, '0');
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatISO(date: Date): string {
  const dd   = String(date.getDate()).padStart(2, '0');
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

function getProgressColor(passed: number, total: number): string {
  if (passed === total) return '#22C55E';
  if (passed >= 2) return '#EAB308';
  return '#EF4444';
}

function getPasswordBorderColor(touched: boolean, ok: boolean, defaultColor: string): string {
  if (!touched) return defaultColor;
  return ok ? '#22C55E' : '#EF4444';
}

// ── Sub-components (independent cognitive complexity) ──────────────────────────

function RuleRow({ labelKey, passed, touched }: { labelKey: string; passed: boolean; touched: boolean }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  let color: string;
  let icon: string;
  if (!touched) {
    color = colors.textMuted; icon = 'radio-button-unchecked';
  } else if (passed) {
    color = '#22C55E'; icon = 'check-circle-outline';
  } else {
    color = '#EF4444'; icon = 'cancel';
  }
  return (
    <View style={ruleStyles.row}>
      <MaterialIcons name={icon as any} size={rw(15)} color={color} />
      <Text style={[ruleStyles.label, { color }]}>{t(labelKey as any)}</Text>
    </View>
  );
}

const ruleStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: rw(7) },
  label: { fontSize: rf(12) },
});

function DateField({ selectedDate, showDatePicker, onOpen, onDateChange, onConfirmIOS }: {
  selectedDate: Date | null;
  showDatePicker: boolean;
  onOpen: () => void;
  onDateChange: (event: DateTimePickerEvent, date?: Date) => void;
  onConfirmIOS: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const borderColor = selectedDate ? colors.purple    : colors.cardBorder;
  const iconColor   = selectedDate ? colors.purple    : colors.textMuted;
  const textColor   = selectedDate ? colors.text      : colors.textMuted;
  const label       = selectedDate ? formatDisplay(selectedDate) : t('auth.register.selectDate');

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>
        {t('auth.register.birthDate')}
      </Text>
      <TouchableOpacity
        style={[styles.inputRow, { backgroundColor: colors.card, borderColor }]}
        onPress={onOpen}
        activeOpacity={0.7}
      >
        <MaterialIcons name="calendar-today" size={rw(20)} color={iconColor} style={styles.inputIcon} />
        <Text style={[styles.input, { color: textColor, fontSize: rf(15), paddingVertical: rh(12) }]}>
          {label}
        </Text>
        <MaterialIcons name="chevron-right" size={rw(20)} color={colors.textMuted} />
      </TouchableOpacity>

      {showDatePicker && (
        <>
          <DateTimePicker
            value={selectedDate ?? new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
            onChange={onDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            locale="es-AR"
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.iosConfirmButton, { backgroundColor: colors.purple }]}
              onPress={onConfirmIOS}
            >
              <Text style={[styles.iosConfirmText, { fontSize: rf(15) }]}>{t('common.done')}</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

function PasswordField({
  password, onChangePassword, showPassword, onTogglePassword,
  passwordTouched, passwordBorderColor, passwordOk, passwordRules, passedCount,
}: {
  password: string;
  onChangePassword: (v: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  passwordTouched: boolean;
  passwordBorderColor: string;
  passwordOk: boolean;
  passwordRules: Array<PasswordRule & { passed: boolean }>;
  passedCount: number;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const lockIconColor = passwordTouched ? passwordBorderColor : colors.purple;
  const eyeIcon       = showPassword ? 'visibility-off' : 'visibility';

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>
        {t('auth.register.password')}
      </Text>
      <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: passwordBorderColor, borderWidth: passwordTouched ? 1.5 : 1 }]}>
        <MaterialIcons name="lock-outline" size={rw(20)} color={lockIconColor} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text, fontSize: rf(15) }]}
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={onChangePassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={onTogglePassword} style={styles.eyeButton}>
          <MaterialIcons name={eyeIcon as any} size={rw(20)} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {passwordTouched && (
        <View style={[styles.rulesCard, { backgroundColor: colors.card, borderColor: passwordOk ? '#22C55E33' : colors.cardBorder }]}>
          <View style={[styles.progressTrack, { backgroundColor: colors.purpleMuted }]}>
            <View
              style={[styles.progressFill, {
                width: `${(passedCount / PASSWORD_RULES.length) * 100}%`,
                backgroundColor: getProgressColor(passedCount, PASSWORD_RULES.length),
              }]}
            />
          </View>
          <View style={styles.rulesList}>
            {passwordRules.map((rule) => (
              <RuleRow key={rule.key} labelKey={rule.labelKey} passed={rule.passed} touched={passwordTouched} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [username, setUsername]           = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [selectedDate, setSelectedDate]   = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const { results: passwordRules, allPassed: passwordOk } = usePasswordValidation(password);
  const birthDate        = selectedDate ? formatISO(selectedDate) : '';
  const allFieldsFilled  = email.trim() && selectedDate !== null && passwordOk;
  const passwordBorderColor = getPasswordBorderColor(passwordTouched, passwordOk, colors.cardBorder);
  const passedCount      = passwordRules.filter((r) => r.passed).length;

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && date) setSelectedDate(date);
    } else if (date) {
      setSelectedDate(date);
    }
  };

  const handlePasswordChange = (v: string) => {
    setPassword(v);
    if (!passwordTouched && v.length > 0) setPasswordTouched(true);
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !birthDate) {
      Alert.alert(t('common.error'), t('auth.register.errorFields'));
      return;
    }
    if (!passwordOk) {
      setPasswordTouched(true);
      Alert.alert(t('common.error'), t('auth.register.errorPassword'));
      return;
    }
    const finalUsername = username.trim() || generateUsername();
    if (!username.trim()) setUsername(finalUsername);
    setLoading(true);
    try {
      await register(email.trim(), password, finalUsername, birthDate);
      track('sign_up', { method: 'email' });
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || t('auth.register.errorFields');
      track('sign_up_failed', { reason: msg });
      Alert.alert(t('common.error'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={rw(24)} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text, fontSize: rf(20) }]}>
              {t('auth.register.title')}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>
                  {t('auth.register.username')}
                </Text>
                <TouchableOpacity onPress={() => setUsername(generateUsername())} style={styles.generateBtn} activeOpacity={0.7}>
                  <MaterialIcons name="casino" size={rw(14)} color={colors.purple} />
                  <Text style={[styles.generateText, { color: colors.purple, fontSize: rf(12) }]}>
                    {t('auth.register.generateUsername')}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <MaterialIcons name="person-outline" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontSize: rf(15) }]}
                  placeholder={t('auth.register.usernamePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>
                {t('auth.register.email')}
              </Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <MaterialIcons name="mail-outline" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontSize: rf(15) }]}
                  placeholder={t('auth.register.emailPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <DateField
              selectedDate={selectedDate}
              showDatePicker={showDatePicker}
              onOpen={() => setShowDatePicker(true)}
              onDateChange={onDateChange}
              onConfirmIOS={() => setShowDatePicker(false)}
            />

            <PasswordField
              password={password}
              onChangePassword={handlePasswordChange}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              passwordTouched={passwordTouched}
              passwordBorderColor={passwordBorderColor}
              passwordOk={passwordOk}
              passwordRules={passwordRules}
              passedCount={passedCount}
            />

            <TouchableOpacity
              style={[styles.submitButton, {
                backgroundColor: allFieldsFilled ? colors.purple : colors.purpleMuted,
                borderWidth: 1,
                borderColor: allFieldsFilled ? colors.purple : colors.purpleBorder,
                opacity: loading ? 0.7 : 1,
              }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={[styles.submitText, { fontSize: rf(16) }]}>{t('auth.register.submit')}</Text>
              }
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={{ color: colors.textMuted, fontSize: rf(14) }}>{t('auth.register.haveAccount')} </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={{ color: colors.purple, fontSize: rf(14), fontWeight: '600' }}>{t('auth.register.login')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1 },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs.md, paddingVertical: rh(14), borderBottomWidth: 1 },
  backButton:       { padding: rs.sm, marginRight: rs.sm },
  headerTitle:      { fontWeight: '600' },
  form:             { padding: rs.xl, gap: rh(18) },
  field:            { gap: rh(8) },
  label:            { fontWeight: '500' },
  inputRow:         { flexDirection: 'row', alignItems: 'center', borderRadius: rw(12), borderWidth: 1, paddingHorizontal: rs.md, paddingVertical: rh(4) },
  inputIcon:        { marginRight: rs.md },
  input:            { flex: 1, paddingVertical: rh(12) },
  eyeButton:        { padding: rs.sm },
  iosConfirmButton: { borderRadius: rw(10), paddingVertical: rh(10), alignItems: 'center', marginTop: rh(4) },
  iosConfirmText:   { color: '#fff', fontWeight: '600' },
  rulesCard:        { borderRadius: rw(12), borderWidth: 1, padding: rw(14), gap: rh(10), marginTop: rh(2) },
  progressTrack:    { height: rh(4), borderRadius: 2, overflow: 'hidden' },
  progressFill:     { height: '100%', borderRadius: 2 },
  rulesList:        { gap: rh(7) },
  submitButton:     { paddingVertical: rh(16), borderRadius: rw(12), alignItems: 'center', marginTop: rh(8) },
  submitText:       { color: '#fff', fontWeight: '600' },
  loginRow:         { flexDirection: 'row', justifyContent: 'center' },
  labelRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  generateBtn:      { flexDirection: 'row', alignItems: 'center', gap: rw(4) },
  generateText:     { fontWeight: '500' },
});
