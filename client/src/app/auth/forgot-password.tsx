import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { rw, rh, rf, rs } from '@/utils/responsive';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Ingresá tu email'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1000);
  };

  if (sent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={rw(24)} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: rf(20) }]}>Recuperar contraseña</Text>
        </View>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.purpleDim }]}>
            <Ionicons name="checkmark-circle" size={rw(48)} color={colors.purple} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text, fontSize: rf(22) }]}>¡Correo enviado!</Text>
          <Text style={[styles.successMsg, { color: colors.textMuted, fontSize: rf(14) }]}>
            Revisá tu bandeja en <Text style={{ color: colors.purple }}>{email}</Text> para restablecer tu contraseña.
          </Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.purple }]} onPress={() => router.push('/auth/login')}>
            <Text style={[styles.buttonText, { fontSize: rf(16) }]}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={rw(24)} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: rf(20) }]}>Recuperar contraseña</Text>
      </View>
      <View style={styles.form}>
        <Text style={[{ color: colors.textMuted, fontSize: rf(14), lineHeight: rh(22) }]}>
          Ingresá tu email y te enviaremos instrucciones para restablecer tu contraseña.
        </Text>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>Email</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="mail-outline" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
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
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, { fontSize: rf(16) }]}>Enviar correo</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs.md, paddingVertical: rh(14), borderBottomWidth: 1 },
  backButton: { padding: rs.sm, marginRight: rs.sm },
  headerTitle: { fontWeight: '600' },
  form: { padding: rs.xl, gap: rh(20) },
  field: { gap: rh(8) },
  label: { fontWeight: '500' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: rw(12),
    borderWidth: 1, paddingHorizontal: rs.md, paddingVertical: rh(4),
  },
  inputIcon: { marginRight: rs.md },
  input: { flex: 1, paddingVertical: rh(12) },
  button: { paddingVertical: rh(16), borderRadius: rw(12), alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: rs.xl, gap: rh(16) },
  successIcon: { width: rw(96), height: rw(96), borderRadius: rw(48), alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontWeight: '700' },
  successMsg: { textAlign: 'center', lineHeight: rh(22) },
});
