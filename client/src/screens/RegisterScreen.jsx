// src/screens/RegisterScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LynkonButton } from '../components/LynkonButton';
import { colors } from '../theme/colors';
import { ms, fs, wp, hp } from '../theme/responsive';

export function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    birthDate: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (field) => (val) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleRegister = async () => {
    const { email, password, birthDate, username } = form;
    if (!email || !password || !birthDate) {
      Alert.alert('Error', 'Email, contraseña y fecha de nacimiento son obligatorios');
      return;
    }
    // Validar formato de fecha YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      Alert.alert('Error', 'La fecha debe tener el formato AAAA-MM-DD');
      return;
    }
    try {
      setLoading(true);
      await register(email.trim(), password, birthDate, username.trim() || undefined);
    } catch (err) {
      Alert.alert('Error al registrarse', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Unificá todos tus juegos en un solo lugar</Text>

        <View style={styles.form}>
          <Field label="Username (opcional)" placeholder="NeonWolf#4823"
            value={form.username} onChange={set('username')} />
          <Field label="Email *" placeholder="tu@email.com"
            value={form.email} onChange={set('email')}
            keyboardType="email-address" autoCapitalize="none" />
          <Field label="Contraseña *" placeholder="Mínimo 6 caracteres"
            value={form.password} onChange={set('password')} secureTextEntry />
          <Field label="Fecha de nacimiento * (AAAA-MM-DD)" placeholder="2000-06-15"
            value={form.birthDate} onChange={set('birthDate')} />

          <LynkonButton
            title="Crear cuenta"
            onPress={handleRegister}
            loading={loading}
            style={styles.btn}
          />

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
            <Text style={styles.loginText}>
              ¿Ya tenés cuenta?{' '}
              <Text style={styles.loginHighlight}>Iniciá sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, ...rest }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholderTextColor={colors.textMuted}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    padding: ms(24),
    paddingTop: 60,
    gap: ms(24),
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fs(14),
    marginTop: -16,
  },
  form: { gap: ms(10) },
  label: {
    color: colors.textSecondary,
    fontSize: fs(13),
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: colors.border,
    padding: ms(14),
    color: colors.text,
    fontSize: fs(15),
    marginBottom: 6,
  },
  btn: { marginTop: 8 },
  loginLink: { alignItems: 'center', marginTop: 8 },
  loginText: { color: colors.textMuted, fontSize: fs(14) },
  loginHighlight: { color: colors.purpleLight, fontWeight: '600' },
});
