import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
import { authApi } from '@/services/api';
import { rw, rh, rf, rs } from '@/utils/responsive';

// ─── Paso 1: ingresar email ────────────────────────────────────────────────────
function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Ingresá tu email'); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
    } catch {
      // El backend siempre responde 200 por seguridad; cubrimos errores de red
    } finally {
      setLoading(false);
      // Avanzamos igual — no revelamos si el email existe o no
      onSent(email.trim().toLowerCase());
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={rw(24)} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: rf(20) }]}>Recuperar contraseña</Text>
      </View>
      <View style={styles.form}>
        <Text style={{ color: colors.textMuted, fontSize: rf(14), lineHeight: rh(22) }}>
          Ingresá tu email y te enviaremos un código de 6 dígitos para restablecer tu contraseña.
        </Text>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>Email</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <MaterialIcons name="mail-outline" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text, fontSize: rf(15) }]}
              placeholder="tu@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onSubmitEditing={handleSubmit}
            />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.purple, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={[styles.buttonText, { fontSize: rf(16) }]}>Enviar código</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Paso 2: ingresar código de 6 dígitos ─────────────────────────────────────
function CodeStep({ email, onVerified }: { email: string; onVerified: (code: string) => void }) {
  const router = useRouter();
  const { colors } = useTheme();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const code = digits.join('');
  const isComplete = code.length === 6;

  const handleDigit = (value: string, index: number) => {
    const clean = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (value: string, index: number) => {
    // Si pegan los 6 dígitos de una vez
    const nums = value.replace(/[^0-9]/g, '').slice(0, 6);
    if (nums.length === 6) {
      setDigits(nums.split(''));
      inputs.current[5]?.focus();
      Keyboard.dismiss();
    } else {
      handleDigit(value, index);
    }
  };

  const handleVerify = async () => {
    if (!isComplete) return;
    setLoading(true);
    try {
      await authApi.verifyResetCode(email, code);
      onVerified(code);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Código inválido o expirado.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.forgotPassword(email);
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      Alert.alert('✅ Código reenviado', 'Revisá tu bandeja de entrada.');
    } catch {
      Alert.alert('Error', 'No se pudo reenviar el código. Intentá de nuevo.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={rw(24)} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: rf(20) }]}>Verificar código</Text>
      </View>

      <View style={styles.form}>
        {/* Banner email enviado */}
        <View style={[styles.sentBanner, { backgroundColor: colors.purpleDim }]}>
          <MaterialIcons name="mark-email-read" size={rw(20)} color={colors.purple} />
          <Text style={[styles.sentText, { color: colors.purple, fontSize: rf(13) }]}>
            Enviamos un código a{' '}
            <Text style={{ fontWeight: '700' }}>{email}</Text>
          </Text>
        </View>

        <Text style={{ color: colors.textMuted, fontSize: rf(13), textAlign: 'center' }}>
          Ingresá el código de 6 dígitos. Expira en 15 minutos.
        </Text>

        {/* Campos de código */}
        <View style={styles.codeRow}>
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              style={[
                styles.codeInput,
                {
                  backgroundColor: colors.card,
                  borderColor: digit ? colors.purple : colors.cardBorder,
                  color: colors.text,
                  fontSize: rf(24),
                },
              ]}
              value={digit}
              onChangeText={(v) => handlePaste(v, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isComplete ? colors.purple : colors.cardBorder, opacity: loading ? 0.7 : 1 },
          ]}
          onPress={handleVerify}
          disabled={!isComplete || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={[styles.buttonText, { fontSize: rf(16) }]}>Verificar código</Text>}
        </TouchableOpacity>

        {/* Reenviar */}
        <View style={styles.resendRow}>
          <Text style={{ color: colors.textMuted, fontSize: rf(13) }}>¿No llegó el código?</Text>
          <TouchableOpacity onPress={handleResend} disabled={resending} style={{ marginLeft: rw(6) }}>
            {resending
              ? <ActivityIndicator size="small" color={colors.purple} />
              : <Text style={{ color: colors.purple, fontSize: rf(13), fontWeight: '600' }}>Reenviar</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Paso 3: nueva contraseña ──────────────────────────────────────────────────
function NewPasswordStep({ email, code }: { email: string; code: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const [newPass, setNewPass]     = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showNew, setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);

  const requirements = [
    { label: 'Mínimo 8 caracteres',    test: (p: string) => p.length >= 8 },
    { label: 'Al menos 6 letras',      test: (p: string) => (p.match(/[a-zA-Z]/g) || []).length >= 6 },
    { label: 'Al menos 2 números',     test: (p: string) => (p.match(/[0-9]/g) || []).length >= 2 },
  ];
  const allMet  = requirements.every((r) => r.test(newPass));
  const match   = newPass === confirm && confirm.length > 0;
  const canSave = allMet && match;

  const handleReset = async () => {
    if (!canSave) return;
    setLoading(true);
    try {
      await authApi.resetPassword(email, code, newPass);
      Alert.alert(
        '✅ Contraseña actualizada',
        'Ya podés iniciar sesión con tu nueva contraseña.',
        [{ text: 'Ir al login', onPress: () => router.replace('/auth/login') }],
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Ocurrió un error. Intentá solicitar un nuevo código.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={rw(24)} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: rf(20) }]}>Nueva contraseña</Text>
      </View>

      <View style={styles.form}>
        {/* Nueva contraseña */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>Nueva contraseña</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <MaterialIcons name="lock-outline" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text, fontSize: rf(15) }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={newPass}
              onChangeText={setNewPass}
              secureTextEntry={!showNew}
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
              <MaterialIcons name={showNew ? 'visibility-off' : 'visibility'} size={rw(20)} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirmar contraseña */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>Confirmar contraseña</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <MaterialIcons name="lock-outline" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text, fontSize: rf(15) }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
              <MaterialIcons name={showConfirm ? 'visibility-off' : 'visibility'} size={rw(20)} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Requisitos */}
        {newPass.length > 0 && (
          <View style={[styles.reqBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {requirements.map((req) => {
              const ok = req.test(newPass);
              return (
                <View key={req.label} style={styles.reqRow}>
                  <MaterialIcons
                    name={ok ? 'check-circle-outline' : 'cancel'}
                    size={rw(16)}
                    color={ok ? '#22C55E' : colors.textMuted}
                  />
                  <Text style={{ fontSize: rf(13), color: ok ? '#22C55E' : colors.textMuted }}>
                    {req.label}
                  </Text>
                </View>
              );
            })}
            {confirm.length > 0 && (
              <View style={styles.reqRow}>
                <MaterialIcons
                  name={match ? 'check-circle-outline' : 'cancel'}
                  size={rw(16)}
                  color={match ? '#22C55E' : '#EF4444'}
                />
                <Text style={{ fontSize: rf(13), color: match ? '#22C55E' : '#EF4444' }}>
                  Las contraseñas coinciden
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: canSave ? colors.purple : colors.cardBorder, opacity: loading ? 0.7 : 1 }]}
          onPress={handleReset}
          disabled={!canSave || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={[styles.buttonText, { fontSize: rf(16) }]}>Cambiar contraseña</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Screen principal — controla los 3 pasos ──────────────────────────────────
export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode]   = useState('');

  if (step === 'code')
    return (
      <CodeStep
        email={email}
        onVerified={(c) => { setCode(c); setStep('password'); }}
      />
    );

  if (step === 'password')
    return <NewPasswordStep email={email} code={code} />;

  return (
    <EmailStep
      onSent={(e) => { setEmail(e); setStep('code'); }}
    />
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs.md, paddingVertical: rh(14), borderBottomWidth: 1 },
  backButton:  { padding: rs.sm, marginRight: rs.sm },
  headerTitle: { fontWeight: '600' },
  sentBanner:  { flexDirection: 'row', alignItems: 'center', gap: rw(10), padding: rs.md, borderRadius: rw(12) },
  sentText:    { flex: 1, lineHeight: rh(20) },
  form:        { padding: rs.xl, gap: rh(20) },
  field:       { gap: rh(8) },
  label:       { fontWeight: '500' },
  inputRow:    { flexDirection: 'row', alignItems: 'center', borderRadius: rw(12), borderWidth: 1, paddingHorizontal: rs.md, paddingVertical: rh(4) },
  inputIcon:   { marginRight: rs.md },
  input:       { flex: 1, paddingVertical: rh(12) },
  eyeBtn:      { padding: rs.sm },
  codeRow:     { flexDirection: 'row', justifyContent: 'center', gap: rw(10) },
  codeInput:   { width: rw(44), height: rw(54), borderRadius: rw(10), borderWidth: 2, fontWeight: '700' },
  resendRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  reqBox:      { borderRadius: rw(12), padding: rw(16), borderWidth: 1, gap: rh(8) },
  reqRow:      { flexDirection: 'row', alignItems: 'center', gap: rw(8) },
  button:      { paddingVertical: rh(16), borderRadius: rw(12), alignItems: 'center' },
  buttonText:  { color: '#fff', fontWeight: '600' },
});
