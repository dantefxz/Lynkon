// src/screens/SettingsScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/services';
import { LynkonButton } from '../components/LynkonButton';
import { InfoCard } from '../components/InfoCard';
import { EmptyState } from '../components/EmptyState';
import { colors } from '../theme/colors';
import { ms, fs, wp, hp } from '../theme/responsive';

export function SettingsScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();

  const [settings, setSettings]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);

  // Campos editables
  const [bio, setBio]               = useState('');
  const [notifications, setNotif]   = useState(true);
  const [privacy, setPrivacy]       = useState('public');

  const loadSettings = useCallback(async () => {
    setError(null);
    try {
      const s = await userService.getSettings(user.uid);
      setSettings(s);
      setNotif(s?.notifications ?? true);
      setPrivacy(s?.privacy ?? 'public');
      setBio(user?.bio || '');
    } catch (err) {
      // Si no existen settings todavía los creamos
      if (err.message?.includes('not found')) {
        try {
          await userService.createSettings(user.uid, { notifications: true, privacy: 'public' });
          setSettings({ notifications: true, privacy: 'public' });
        } catch {
          setError('No se pudo inicializar la configuración');
        }
      } else {
        setError(err.message || 'Error al cargar configuración');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSaveProfile = async () => {
    if (bio.length > 300) {
      Alert.alert('Error', 'La bio no puede superar los 300 caracteres');
      return;
    }
    setSaving(true);
    try {
      await userService.updateProfile(user.uid, { bio });
      updateUser({ bio });
      Alert.alert('Guardado ✓', 'Tu perfil fue actualizado');
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotifications = async (val) => {
    setNotif(val);
    try {
      await userService.updateSettings(user.uid, { notifications: val });
    } catch {
      setNotif(!val); // revertir
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    }
  };

  const handleTogglePrivacy = async (val) => {
    const newPrivacy = val ? 'public' : 'private';
    setPrivacy(newPrivacy);
    try {
      await userService.updateSettings(user.uid, { privacy: newPrivacy });
    } catch {
      setPrivacy(privacy); // revertir
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Eliminar cuenta',
      'Esta acción es irreversible. Se eliminarán todos tus datos, juegos y conversaciones.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar para siempre',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteUser(user.uid);
              logout();
            } catch (err) {
              Alert.alert('Error', err.message || 'No se pudo eliminar la cuenta');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.purple} />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Error al cargar"
        description={error}
        actionLabel="Reintentar"
        onAction={() => { setLoading(true); loadSettings(); }}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Configuración</Text>

      {/* Perfil */}
      <Section title="Perfil">
        <InfoCard
          logo={<Text style={{ fontSize: fs(22) }}>👤</Text>}
          miniTitle="Cuenta"
          title={user?.username || user?.name || 'Usuario'}
          description={user?.email}
        />

        <View style={styles.bioContainer}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Contá algo sobre vos..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={300}
          />
          <Text style={[styles.charCount, bio.length > 280 && styles.charCountWarning]}>
            {bio.length}/300
          </Text>
        </View>

        <LynkonButton
          title="Guardar cambios"
          onPress={handleSaveProfile}
          loading={saving}
          size="sm"
        />
      </Section>

      {/* Privacidad */}
      <Section title="Privacidad y notificaciones">
        <ToggleRow
          label="Perfil público"
          description="Otros jugadores pueden ver tu perfil y recomendaciones"
          value={privacy === 'public'}
          onToggle={handleTogglePrivacy}
        />
        <ToggleRow
          label="Notificaciones"
          description="Recibí alertas de solicitudes de amistad y mensajes"
          value={notifications}
          onToggle={handleToggleNotifications}
        />
        {user?.isUnder16 && (
          <View style={styles.ageWarning}>
            <Text style={styles.ageWarningText}>
              🔒 Las recomendaciones de jugadores están deshabilitadas para usuarios menores de 16 años
            </Text>
          </View>
        )}
      </Section>

      {/* Plataformas */}
      <Section title="Plataformas">
        <InfoCard
          logo={<Text style={{ fontSize: fs(22) }}>🎮</Text>}
          miniTitle="Cuentas vinculadas"
          title="Gestionar plataformas"
          description="Vinculá o desvinculá Steam, PSN y Xbox"
          onPress={() => navigation.navigate('LinkPlatform')}
          rightContent={<Text style={{ color: colors.purpleLight, fontSize: fs(20) }}>›</Text>}
        />
      </Section>

      {/* Sesión */}
      <Section title="Sesión">
        <LynkonButton
          title="Cerrar sesión"
          variant="secondary"
          onPress={handleLogout}
        />
      </Section>

      {/* Zona de peligro */}
      <Section title="Zona de peligro">
        <View style={styles.dangerBox}>
          <Text style={styles.dangerTitle}>Eliminar cuenta</Text>
          <Text style={styles.dangerDesc}>
            Se eliminarán permanentemente tu perfil, juegos, amigos y mensajes. Esta acción no se puede deshacer.
          </Text>
          <LynkonButton
            title="Eliminar mi cuenta"
            variant="danger"
            onPress={handleDeleteAccount}
            style={styles.dangerBtn}
          />
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function ToggleRow({ label, description, value, onToggle }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && <Text style={styles.toggleDesc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        thumbColor={value ? '#fff' : '#9CA3AF'}
        trackColor={{ false: '#374151', true: colors.purple }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.background },
  center:            { flex: 1, alignItems: 'center', justifyContent: 'center', gap: ms(12) },
  loadingText:       { color: colors.textMuted, fontSize: fs(14) },
  content:           { padding: ms(16), paddingBottom: 100, gap: ms(24) },
  title:             { color: colors.text, fontSize: fs(24), fontWeight: '800' },
  section:           { gap: ms(10) },
  sectionTitle:      { color: colors.textSecondary, fontSize: fs(12), fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  sectionBody:       { gap: ms(10) },
  label:             { color: colors.textSecondary, fontSize: fs(13), fontWeight: '500', marginBottom: 4 },
  bioContainer:      { gap: 4 },
  bioInput: {
    backgroundColor: colors.card, borderRadius: ms(12), borderWidth: 1,
    borderColor: colors.border, padding: ms(14), color: colors.text,
    fontSize: fs(14), minHeight: 80, textAlignVertical: 'top',
  },
  charCount:         { color: colors.textMuted, fontSize: fs(11), textAlign: 'right' },
  charCountWarning:  { color: colors.warning },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: ms(14), borderWidth: 1,
    borderColor: colors.border, padding: ms(14),
  },
  toggleText:        { flex: 1, marginRight: 12 },
  toggleLabel:       { color: colors.text, fontSize: fs(14), fontWeight: '500' },
  toggleDesc:        { color: colors.textMuted, fontSize: fs(12), marginTop: 2 },
  ageWarning: {
    backgroundColor: 'rgba(234,179,8,0.1)', borderRadius: ms(12),
    borderWidth: 1, borderColor: 'rgba(234,179,8,0.3)', padding: ms(12),
  },
  ageWarningText:    { color: '#EAB308', fontSize: fs(12), lineHeight: 18 },
  dangerBox: {
    backgroundColor: 'rgba(239,68,68,0.05)', borderRadius: ms(14),
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', padding: ms(16), gap: ms(10),
  },
  dangerTitle:       { color: colors.error, fontSize: fs(15), fontWeight: '700' },
  dangerDesc:        { color: colors.textMuted, fontSize: fs(13), lineHeight: 18 },
  dangerBtn:         { marginTop: 4 },
});
