import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { AppButton } from '@/components';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { Alert.alert('Error', 'Completá todos los campos'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Credenciales incorrectas');
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>Iniciar sesión</Text>
          </View>
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.purple }]}>Email</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <MaterialIcons name="mail-outline" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
                <TextInput style={[styles.input, { color: colors.text }]} placeholder="tu@email.com" placeholderTextColor={colors.textMuted}
                  value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              </View>
            </View>
            {/* Password */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.purple }]}>Contraseña</Text>
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
              <Text style={{ color: colors.purple, fontSize: rf(14) }}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            <AppButton label="Iniciar sesión" onPress={handleLogin} loading={loading} />
            <View style={styles.registerRow}>
              <Text style={{ color: colors.textMuted, fontSize: rf(14) }}>¿No tenés cuenta? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Text style={{ color: colors.purple, fontSize: rf(14), fontWeight: '600' }}>Registrate</Text>
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