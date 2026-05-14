// src/screens/LoginScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LynkonButton } from '../components/LynkonButton';
import { colors } from '../theme/colors';
import { ms, fs, wp, hp } from '../theme/responsive';

export function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo iniciar sesión');
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
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <Text style={styles.appName}>Lynkon</Text>
          <Text style={styles.tagline}>Tu perfil gamer unificado</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />

          <LynkonButton
            title="Iniciar sesión"
            onPress={handleLogin}
            loading={loading}
            style={styles.btn}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>
              ¿No tenés cuenta?{' '}
              <Text style={styles.registerHighlight}>Registrate</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: ms(24),
    gap: 32,
  },
  logoArea: {
    alignItems: 'center',
    gap: ms(8),
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
  },
  appName: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  tagline: {
    color: colors.textMuted,
    fontSize: fs(14),
  },
  form: {
    gap: ms(10),
  },
  label: {
    color: colors.textSecondary,
    fontSize: fs(13),
    fontWeight: '500',
    marginBottom: 2,
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
  btn: {
    marginTop: 8,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  registerText: {
    color: colors.textMuted,
    fontSize: fs(14),
  },
  registerHighlight: {
    color: colors.purpleLight,
    fontWeight: '600',
  },
});
