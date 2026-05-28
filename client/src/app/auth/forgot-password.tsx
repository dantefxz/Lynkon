import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
import { authApi } from '@/services/api';
import { rw, rh, rf, rs } from '@/utils/responsive';

// ─── Paso 1: ingresar email ────────────────────────────────────────────────────
function ForgotStep({ onSent }: { onSent: (email: string) => void }) {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Ingresá tu email'); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      onSent(email.trim().toLowerCase());
    } catch {
      // Por seguridad el backend siempre responde 200, pero cubrimos errores de red
      onSent(email.trim().toLowerCase());
    } finally { setLoading(false); }
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
          Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
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
            : <Text style={[styles.buttonText, { fontSize: rf(16) }]}>Enviar correo</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Paso 2: email enviado, ingresar código + nueva contraseña ─────────────────
function ResetStep({ email }: { email: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const [oobCode, setOobCode]     = useState('');
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
  const allMet   = requirements.every((r) => r.test(newPass));
  const match    = newPass === confirm && confirm.length > 0;
  const canSave  = oobCode.trim().length > 0 && allMet && match;

  const handleReset = async () => {
    if (!canSave) return;
    setLoading(true);
    try {
      await authApi.resetPassword(oobCode.trim(), newPass);
      Alert.alert(
        '✅ Contraseña actualizada',
        'Ya podés iniciar sesión con tu nueva contraseña.',
        [{ text: 'Ir al login', onPress: () => router.replace('/auth/login') }],
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'El código es inválido o expiró. Solicitá uno nuevo.';
      Alert.alert('Error', msg);
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={rw(24)} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: rf(20) }]}>Nueva contraseña</Text>
      </View>

      {/* Aviso de email enviado */}
      <View style={[styles.sentBanner, { backgroundColor: colors.purpleDim }]}>
        <MaterialIcons name="check-circle-outline" size={rw(20)} color={colors.purple} />
        <Text style={[styles.sentText, { color: colors.purple, fontSize: rf(13) }]}>
          Revisá tu bandeja en <Text style={{ fontWeight: '700' }}>{email}</Text>
        </Text>
      </View>

      <View style={styles.form}>
        {/* Código del email */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>Código del email</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <MaterialIcons name="vpn-key" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text, fontSize: rf(15) }]}
              placeholder="Pegá el código recibido"
              placeholderTextColor={colors.textMuted}
              value={oobCode}
              onChangeText={setOobCode}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

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
          style={[styles.button, { backgroundColor: canSave ? colors.purple : colors.textMuted, opacity: loading ? 0.7 : 1 }]}
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

// ─── Screen principal — controla el paso activo ───────────────────────────────
export default function ForgotPasswordScreen() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (sentTo) return <ResetStep email={sentTo} />;
  return <ForgotStep onSent={setSentTo} />;
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs.md, paddingVertical: rh(14), borderBottomWidth: 1 },
  backButton:   { padding: rs.sm, marginRight: rs.sm },
  headerTitle:  { fontWeight: '600' },
  sentBanner:   { flexDirection: 'row', alignItems: 'center', gap: rw(10), margin: rs.md, padding: rs.md, borderRadius: rw(12) },
  sentText:     { flex: 1, lineHeight: rh(20) },
  form:         { padding: rs.xl, gap: rh(20) },
  field:        { gap: rh(8) },
  label:        { fontWeight: '500' },
  inputRow:     { flexDirection: 'row', alignItems: 'center', borderRadius: rw(12), borderWidth: 1, paddingHorizontal: rs.md, paddingVertical: rh(4) },
  inputIcon:    { marginRight: rs.md },
  input:        { flex: 1, paddingVertical: rh(12) },
  eyeBtn:       { padding: rs.sm },
  reqBox:       { borderRadius: rw(12), padding: rw(16), borderWidth: 1, gap: rh(8) },
  reqRow:       { flexDirection: 'row', alignItems: 'center', gap: rw(8) },
  button:       { paddingVertical: rh(16), borderRadius: rw(12), alignItems: 'center' },
  buttonText:   { color: '#fff', fontWeight: '600' },
});
