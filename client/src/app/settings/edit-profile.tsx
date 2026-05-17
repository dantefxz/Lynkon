import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { userApi } from '@/services/api';
import { rw, rh, rf, rs } from '@/utils/responsive';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUserName, updateUserAvatar } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || PRESET_AVATARS[0]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (user?.id) await userApi.updateProfile(user.id, { username: name, avatar: selectedAvatar });
      updateUserName(name);
      updateUserAvatar(selectedAvatar);
      Alert.alert('✅ Listo', 'Perfil actualizado correctamente');
      router.back();
    } catch {
      updateUserName(name);
      updateUserAvatar(selectedAvatar);
      router.back();
    } finally { setLoading(false); }
  };

  const avatarSize = rw(100);
  const optionSize = rw(60);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.backgroundGrad, borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={rw(24)} color={colors.purple} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: rf(20) }]}>Editar Perfil</Text>
        </View>

        <View style={[styles.content, { padding: rs.xl, gap: rh(24) }]}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatarRing, { borderColor: colors.purple, width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
              <Image source={{ uri: selectedAvatar }} style={styles.avatar} />
            </View>
            <TouchableOpacity style={[styles.changeAvatarBtn, { backgroundColor: colors.purple }]} onPress={() => setShowPicker(!showPicker)}>
              <Ionicons name="camera-outline" size={rw(16)} color="#fff" />
              <Text style={[styles.changeAvatarText, { fontSize: rf(14) }]}>Cambiar foto</Text>
            </TouchableOpacity>
          </View>

          {showPicker && (
            <View style={[styles.avatarPicker, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.pickerTitle, { color: colors.text, fontSize: rf(15) }]}>Elegí un avatar</Text>
              <View style={styles.avatarGrid}>
                {PRESET_AVATARS.map((av) => (
                  <TouchableOpacity
                    key={av}
                    onPress={() => { setSelectedAvatar(av); setShowPicker(false); }}
                    style={[styles.avatarOption, { width: optionSize, height: optionSize, borderRadius: optionSize / 2 },
                      selectedAvatar === av && { borderColor: colors.purple, borderWidth: 3 }]}
                  >
                    <Image source={{ uri: av }} style={styles.avatarOptionImg} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>Nombre de usuario</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Ionicons name="person-outline" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, fontSize: rf(15) }]}
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre de usuario"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.purple, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.saveText, { fontSize: rf(16) }]}>Guardar cambios</Text>}
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
  avatarSection: { alignItems: 'center', gap: rh(16) },
  avatarRing: { borderWidth: 3, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  changeAvatarBtn: { flexDirection: 'row', alignItems: 'center', gap: rw(8), paddingHorizontal: rw(16), paddingVertical: rh(8), borderRadius: rw(20) },
  changeAvatarText: { color: '#fff', fontWeight: '600' },
  avatarPicker: { borderRadius: rw(16), padding: rw(16), borderWidth: 1, gap: rh(12) },
  pickerTitle: { fontWeight: '600' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: rw(10) },
  avatarOption: { overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  avatarOptionImg: { width: '100%', height: '100%' },
  field: { gap: rh(8) },
  label: { fontWeight: '500' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: rw(12),
    borderWidth: 1, paddingHorizontal: rs.md, paddingVertical: rh(4),
  },
  inputIcon: { marginRight: rs.md },
  input: { flex: 1, paddingVertical: rh(12) },
  saveButton: { paddingVertical: rh(16), borderRadius: rw(12), alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});
