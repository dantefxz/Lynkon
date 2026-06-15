import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { userApi } from '@/services/api';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { AVATAR_IDS, normalizeAvatarId, resolveAvatarSource } from '@/constants/avatars';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUserAvatar } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [selectedAvatarId, setSelectedAvatarId] = useState(normalizeAvatarId(user?.avatar, user?.id || user?.name || ''));
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (user?.id) await userApi.updateProfile(user.id, { avatarId: selectedAvatarId });
    } catch {}
    updateUserAvatar(selectedAvatarId);
    setLoading(false);
    router.back();
  };

  const avatarSize = rw(100);
  const optionSize = rw(60);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.backgroundGrad, borderBottomColor: colors.cardBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={rw(24)} color={colors.purple} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: rf(20) }]}>{t('editProfile.title')}</Text>
        </View>

        <View style={[styles.content, { padding: rs.xl, gap: rh(24) }]}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatarRing, { borderColor: colors.purple, width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
              <Image source={resolveAvatarSource(selectedAvatarId, user?.id || user?.name || '')} style={styles.avatar} />
            </View>
          </View>

          <View style={[styles.avatarPicker, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.pickerTitle, { color: colors.text, fontSize: rf(15) }]}>{t('editProfile.pickAvatar')}</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_IDS.map((avatarId) => (
                <TouchableOpacity
                  key={avatarId}
                  onPress={() => setSelectedAvatarId(avatarId)}
                  style={[
                    styles.avatarOption,
                    { width: optionSize, height: optionSize, borderRadius: optionSize / 2 },
                    selectedAvatarId === avatarId && { borderColor: colors.purple, borderWidth: 3 },
                  ]}
                >
                  <Image source={resolveAvatarSource(avatarId)} style={styles.avatarOptionImg} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.purple, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.saveText, { fontSize: rf(16) }]}>{t('editProfile.save')}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs.md, paddingVertical: rh(14), borderBottomWidth: 1 },
  backButton:      { marginRight: rs.md },
  headerTitle:     { fontWeight: '600' },
  content:         {},
  avatarSection:   { alignItems: 'center' },
  avatarRing:      { borderWidth: 3, overflow: 'hidden' },
  avatar:          { width: '100%', height: '100%' },
  avatarPicker:    { borderRadius: rw(16), padding: rw(16), borderWidth: 1, gap: rh(12) },
  pickerTitle:     { fontWeight: '600' },
  avatarGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: rw(10) },
  avatarOption:    { overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  avatarOptionImg: { width: '100%', height: '100%' },
  saveButton:      { paddingVertical: rh(16), borderRadius: rw(12), alignItems: 'center' },
  saveText:        { color: '#fff', fontWeight: '600' },
});
