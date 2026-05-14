// src/screens/LinkPlatformScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, Alert, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { platformService } from '../services/services';
import { LynkonButton } from '../components/LynkonButton';
import { InfoCard } from '../components/InfoCard';
import { colors } from '../theme/colors';
import { ms, fs, wp, hp } from '../theme/responsive';

const PLATFORMS = [
  {
    id:          'steam',
    label:       'Steam',
    icon:        '🟦',
    fieldLabel:  'Steam ID',
    placeholder: '76561198xxxxxxxxx',
    hint:        'Encontralo en tu perfil de Steam → Editar perfil → Steam ID personalizado. O usá steamid.io para buscarlo.',
  },
  {
    id:          'psn',
    label:       'PlayStation Network',
    icon:        '🎮',
    fieldLabel:  'NPSSO Token',
    placeholder: 'Token de 64 caracteres',
    hint:        'Iniciá sesión en my.playstation.com, abrí DevTools (F12) → Application → Cookies → buscá "npsso".',
  },
  {
    id:          'xbox',
    label:       'Xbox Live',
    icon:        '🟩',
    fieldLabel:  'Xbox User ID (XUID)',
    placeholder: '2535xxxxxxxxxxxxxxx',
    hint:        'Encontralo en xboxgamertag.com ingresando tu Gamertag.',
  },
];

export function LinkPlatformScreen({ navigation }) {
  const { user } = useAuth();
  const [selected, setSelected]   = useState(null);
  const [credential, setCredential] = useState('');
  const [loading, setLoading]     = useState(false);

  const selectedPlatform = PLATFORMS.find((p) => p.id === selected);

  const handleLink = async () => {
    if (!selected) {
      Alert.alert('Seleccioná una plataforma');
      return;
    }
    if (!credential.trim()) {
      Alert.alert('Error', `Ingresá tu ${selectedPlatform.fieldLabel}`);
      return;
    }

    Alert.alert(
      `Vincular ${selectedPlatform.label}`,
      `¿Confirmás vincular con ${selectedPlatform.fieldLabel}: "${credential.trim()}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vincular',
          onPress: async () => {
            setLoading(true);
            try {
              await platformService.link(user.uid, {
                platform:       selected,
                platformUserId: credential.trim(),
              });
              Alert.alert(
                '¡Vinculado! 🎉',
                `${selectedPlatform.label} fue vinculado a tu cuenta. Tus juegos se sincronizarán en breve.`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (err) {
              if (err.message?.includes('already linked')) {
                Alert.alert('Aviso', `${selectedPlatform.label} ya está vinculado a tu cuenta`);
              } else {
                Alert.alert('Error', err.message || 'No se pudo vincular la plataforma');
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Vincular plataforma</Text>
      <Text style={styles.subtitle}>
        Conectá tus cuentas para ver tus juegos, horas y logros en un solo lugar.
      </Text>

      {/* Selector de plataformas */}
      <View style={styles.platformsGrid}>
        {PLATFORMS.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.platformOption, selected === p.id && styles.platformSelected]}
            onPress={() => { setSelected(p.id); setCredential(''); }}
            activeOpacity={0.8}
          >
            <Text style={styles.platformIcon}>{p.icon}</Text>
            <Text style={[styles.platformLabel, selected === p.id && styles.platformLabelSelected]}>
              {p.label}
            </Text>
            {selected === p.id && (
              <View style={styles.checkBadge}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Formulario de credencial */}
      {selectedPlatform && (
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>{selectedPlatform.fieldLabel}</Text>
          <TextInput
            style={styles.input}
            value={credential}
            onChangeText={setCredential}
            placeholder={selectedPlatform.placeholder}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Hint de cómo obtener la credencial */}
          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>💡 ¿Cómo obtengo esto?</Text>
            <Text style={styles.hintText}>{selectedPlatform.hint}</Text>
          </View>

          <LynkonButton
            title={`Vincular ${selectedPlatform.label}`}
            onPress={handleLink}
            loading={loading}
          />
        </View>
      )}

      {/* Info adicional */}
      <InfoCard
        logo={<Text style={{ fontSize: fs(20) }}>🔒</Text>}
        miniTitle="Tu privacidad"
        title="Tus credenciales están seguras"
        description="Solo usamos tus datos para mostrar tus juegos. Nunca compartimos tu información con terceros."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: colors.background },
  content:              { padding: ms(16), paddingBottom: 100, gap: ms(20) },
  title:                { color: colors.text, fontSize: fs(24), fontWeight: '800' },
  subtitle:             { color: colors.textMuted, fontSize: fs(14), lineHeight: 20, marginTop: -12 },
  platformsGrid:        { gap: ms(10) },
  platformOption: {
    backgroundColor:    colors.card, borderRadius: ms(14), borderWidth: 1,
    borderColor:        colors.border, padding: ms(16),
    flexDirection:      'row', alignItems: 'center', gap: ms(12),
  },
  platformSelected:     { borderColor: colors.purple, backgroundColor: colors.purpleMuted },
  platformIcon:         { fontSize: fs(24) },
  platformLabel:        { color: colors.textMuted, fontSize: fs(15), fontWeight: '500', flex: 1 },
  platformLabelSelected:{ color: colors.text },
  checkBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center',
  },
  checkText:            { color: '#fff', fontSize: fs(12), fontWeight: '700' },
  form:                 { gap: ms(10) },
  fieldLabel:           { color: colors.textSecondary, fontSize: fs(13), fontWeight: '500' },
  input: {
    backgroundColor:    colors.card, borderRadius: ms(12), borderWidth: 1,
    borderColor:        colors.border, padding: ms(14),
    color:              colors.text, fontSize: fs(14),
  },
  hintBox: {
    backgroundColor:    'rgba(124,58,237,0.08)', borderRadius: ms(12),
    borderWidth:        1, borderColor: colors.purpleBorder, padding: ms(14), gap: 6,
  },
  hintTitle:            { color: colors.textSecondary, fontSize: fs(13), fontWeight: '600' },
  hintText:             { color: colors.textMuted, fontSize: fs(12), lineHeight: 18 },
});
