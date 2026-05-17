import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { userApi } from '@/services/api';
import { rw, rh, rf, rs } from '@/utils/responsive';

const requirements = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Al menos una mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Al menos una minúscula', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Al menos un número', test: (p: string) => /[0-9]/.test(p) },
];

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const allMet = requirements.every((r) => r.test(newPass));
  const match = newPass === confirm && confirm.length > 0;
  const canSubmit = current.length > 0 && allMet && match;

  const handleSave = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      if (user?.id) await userApi.changePassword(user.id, current, newPass);
      Alert.alert('✅ Contraseña actualizada', 'Tu contraseña fue cambiada correctamente');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'La contraseña actual es incorrecta');
    } finally { setLoading(false); }
  };

  const fields = [
    { label: 'Contraseña actual', value: current, setter: setCurrent, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
    { label: 'Nueva contraseña', value: newPass, setter: setNewPass, show: showNew, toggle: () => setShowNew(!showNew) },
    { label: 'Confirmar contraseña', value: confirm, setter: setConfirm, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { backgroundColor: colors.backgroundGrad, borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={rw(24)} color={colors.purple} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: rf(20) }]}>Cambiar Contraseña</Text>
        </View>

        <View style={[styles.content, { padding: rs.xl, gap: rh(20) }]}>
          {fields.map(({ label, value, setter, show, toggle }) => (
            <View key={label} style={styles.field}>
              <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>{label}</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Ionicons name="lock-closed-outline" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text, fontSize: rf(15) }]}
                  value={value}
                  onChangeText={setter}
                  secureTextEntry={!show}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity onPress={toggle} style={styles.eyeBtn}>
                  <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={rw(20)} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {newPass.length > 0 && (
            <View style={[styles.requirementsBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {requirements.map((req) => {
                const ok = req.test(newPass);
                return (
                  <View key={req.label} style={styles.reqRow}>
                    <Ionicons name={ok ? 'checkmark-circle' : 'close-circle'} size={rw(16)} color={ok ? '#22C55E' : colors.textMuted} />
                    <Text style={[{ fontSize: rf(13) }, { color: ok ? '#22C55E' : colors.textMuted }]}>{req.label}</Text>
                  </View>
                );
              })}
              {confirm.length > 0 && (
                <View style={styles.reqRow}>
                  <Ionicons name={match ? 'checkmark-circle' : 'close-circle'} size={rw(16)} color={match ? '#22C55E' : '#EF4444'} />
                  <Text style={[{ fontSize: rf(13) }, { color: match ? '#22C55E' : '#EF4444' }]}>Las contraseñas coinciden</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: canSubmit ? colors.purple : colors.textMuted, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={!canSubmit || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.saveText, { fontSize: rf(16) }]}>Cambiar contraseña</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs.md, paddingVertical: rh(14), borderBottomWidth: 1 },
  backButton: { marginRight: rs.md },
  headerTitle: { fontWeight: '600' },
  content: {},
  field: { gap: rh(8) },
  label: { fontWeight: '500' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: rw(12),
    borderWidth: 1, paddingHorizontal: rs.md, paddingVertical: rh(4),
  },
  inputIcon: { marginRight: rs.md },
  input: { flex: 1, paddingVertical: rh(12) },
  eyeBtn: { padding: rs.sm },
  requirementsBox: { borderRadius: rw(12), padding: rw(16), borderWidth: 1, gap: rh(8) },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: rw(8) },
  saveButton: { paddingVertical: rh(16), borderRadius: rw(12), alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});
