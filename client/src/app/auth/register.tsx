import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { rw, rh, rf, rs } from '@/utils/responsive';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim() || !birthDate.trim()) {
      Alert.alert('Error', 'Por favor completá todos los campos');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, username.trim(), birthDate.trim());
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'No se pudo completar el registro';
      Alert.alert('Error al registrarse', msg);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'Usuario', value: username, setter: setUsername, icon: 'person-outline', placeholder: 'tu_usuario', type: 'default' },
    { label: 'Email', value: email, setter: setEmail, icon: 'mail-outline', placeholder: 'tu@email.com', type: 'email-address' },
    { label: 'Fecha de nacimiento', value: birthDate, setter: setBirthDate, icon: 'calendar-outline', placeholder: 'YYYY-MM-DD', type: 'default' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={rw(24)} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text, fontSize: rf(20) }]}>Registrarse</Text>
          </View>

          <View style={styles.form}>
            {fields.map(({ label, value, setter, icon, placeholder, type }) => (
              <View key={label} style={styles.field}>
                <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>{label}</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Ionicons name={icon as any} size={rw(20)} color={colors.purple} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text, fontSize: rf(15) }]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    value={value}
                    onChangeText={setter}
                    keyboardType={type as any}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>Contraseña</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Ionicons name="lock-closed-outline" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontSize: rf(15) }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={rw(20)} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.purple, opacity: loading ? 0.7 : 1 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={[styles.submitText, { fontSize: rf(16) }]}>Crear cuenta</Text>
              }
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={{ color: colors.textMuted, fontSize: rf(14) }}>¿Ya tenés cuenta? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={{ color: colors.purple, fontSize: rf(14), fontWeight: '600' }}>Iniciá sesión</Text>
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
  headerTitle: { fontWeight: '600' },
  form: { padding: rs.xl, gap: rh(18) },
  field: { gap: rh(8) },
  label: { fontWeight: '500' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: rw(12),
    borderWidth: 1, paddingHorizontal: rs.md, paddingVertical: rh(4),
  },
  inputIcon: { marginRight: rs.md },
  input: { flex: 1, paddingVertical: rh(12) },
  eyeButton: { padding: rs.sm },
  submitButton: { paddingVertical: rh(16), borderRadius: rw(12), alignItems: 'center', marginTop: rh(8) },
  submitText: { color: '#fff', fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
});
