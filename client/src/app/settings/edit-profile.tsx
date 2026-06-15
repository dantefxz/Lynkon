import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert, ActivityIndicator,
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
  const { user, updateUserName, updateUserAvatar, updateUserBio } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [name, setName]   = useState(user?.name || '');
  const [bio,  setBio]    = useState(user?.bio  || '');
  const [selectedAvatarId, setSelectedAvatarId] = useState(normalizeAvatarId(user?.avatar, user?.id || user?.name || ''));
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading]       = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (user?.id) await userApi.updateProfile(user.id, { username: name, avatarId: selectedAvatarId, bio });
      updateUserName(name);
      updateUserAvatar(selectedAvatarId);
      updateUserBio(bio);
      Alert.alert(t('common.success'), t('editProfile.saved'));
      router.back();
    } catch {
      updateUserName(name);
      updateUserAvatar(selectedAvatarId);
      updateUserBio(bio);
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
            <MaterialIcons name="arrow-back" size={rw(24)} color={colors.purple} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: rf(20) }]}>{t('editProfile.title')}</Text>
        </View>

        <View style={[styles.content, { padding: rs.xl, gap: rh(24) }]}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarRing, { borderColor: colors.purple, width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
              <Image source={resolveAvatarSource(selectedAvatarId, user?.id || user?.name || '')} style={styles.avatar} />
            </View>
            <TouchableOpacity style={[styles.changeAvatarBtn, { backgroundColor: colors.purple }]} onPress={() => setShowPicker(!showPicker)}>
              <MaterialIcons name="photo-camera" size={rw(16)} color="#fff" />
              <Text style={[styles.changeAvatarText, { fontSize: rf(14) }]}>{t('editProfile.changePhoto')}</Text>
            </TouchableOpacity>
          </View>

          {showPicker && (
            <View style={[styles.avatarPicker, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.pickerTitle, { color: colors.text, fontSize: rf(15) }]}>{t('editProfile.pickAvatar')}</Text>
              <View style={styles.avatarGrid}>
                {AVATAR_IDS.map((avatarId) => (
                  <TouchableOpacity
                    key={avatarId}
                    onPress={() => { setSelectedAvatarId(avatarId); setShowPicker(false); }}
                    style={[styles.avatarOption, { width: optionSize, height: optionSize, borderRadius: optionSize / 2 },
                      selectedAvatarId === avatarId && { borderColor: colors.purple, borderWidth: 3 }]}
                  >
                    <Image source={resolveAvatarSource(avatarId)} style={styles.avatarOptionImg} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Username */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>{t('editProfile.username')}</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <MaterialIcons name="person-outline" size={rw(20)} color={colors.purple} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, fontSize: rf(15) }]}
                value={name}
                onChangeText={setName}
                placeholder={t('editProfile.usernamePlaceholder')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Bio */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.purple, fontSize: rf(14) }]}>{t('editProfile.bio')}</Text>
            <View style={[styles.bioRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <TextInput
                style={[styles.bioInput, { color: colors.text, fontSize: rf(15) }]}
                value={bio}
                onChangeText={setBio}
                placeholder={t('editProfile.bioHint')}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                maxLength={200}
                textAlignVertical="top"
                autoCorrect={false}
              />
            </View>
            <Text style={[styles.charCount, { color: colors.textMuted, fontSize: rf(11) }]}>
              {bio.length}/200
            </Text>
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
  avatarSection:   { alignItems: 'center', gap: rh(16) },
  avatarRing:      { borderWidth: 3, overflow: 'hidden' },
  avatar:          { width: '100%', height: '100%' },
  changeAvatarBtn: { flexDirection: 'row', alignItems: 'center', gap: rw(8), paddingHorizontal: rw(16), paddingVertical: rh(8), borderRadius: rw(20) },
  changeAvatarText:{ color: '#fff', fontWeight: '600' },
  avatarPicker:    { borderRadius: rw(16), padding: rw(16), borderWidth: 1, gap: rh(12) },
  pickerTitle:     { fontWeight: '600' },
  avatarGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: rw(10) },
  avatarOption:    { overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  avatarOptionImg: { width: '100%', height: '100%' },
  field:           { gap: rh(8) },
  label:           { fontWeight: '500' },
  inputRow:        { flexDirection: 'row', alignItems: 'center', borderRadius: rw(12), borderWidth: 1, paddingHorizontal: rs.md, paddingVertical: rh(4) },
  inputIcon:       { marginRight: rs.md },
  input:           { flex: 1, paddingVertical: rh(12) },
  bioRow:          { borderRadius: rw(12), borderWidth: 1, paddingHorizontal: rs.md, paddingVertical: rh(10) },
  bioInput:        { minHeight: rh(100) },
  charCount:       { textAlign: 'right' },
  saveButton:      { paddingVertical: rh(16), borderRadius: rw(12), alignItems: 'center' },
  saveText:        { color: '#fff', fontWeight: '600' },
});
