import { Tabs } from 'expo-router';
import { View, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { rw, rh, rf } from '@/utils/responsive';
import { resolveAvatarSource } from '@/constants/avatars';

function AvatarTabIcon({ focused, avatar, colors, seed }: { focused: boolean; avatar: string; colors: any; seed: string }) {
  const size = rw(48);
  const avatarSource = resolveAvatarSource(avatar, seed);
  return (
    <View style={[
      { width: size, height: size, borderRadius: size / 2, borderWidth: 2, overflow: 'hidden', marginBottom: rh(5) },
      focused
        ? { borderColor: colors.purple, shadowColor: colors.purple, shadowOpacity: 0.6, shadowRadius: 8, elevation: 6 }
        : { borderColor: colors.textMuted },
    ]}>
      <Image source={avatarSource} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

export default function TabsLayout() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          height: rh(72),
          paddingBottom: rh(12),
          paddingTop: rh(8),
        },
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: rf(10), fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="social"
        options={{
          title: t('tabs.social'),
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="forum" size={rw(24)} color={color} />
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const currentRoute = state?.routes?.[state.index];
            if (currentRoute?.name === route.name) {
              e.preventDefault();
            }
          },
        })}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }) => (
            <AvatarTabIcon focused={focused} avatar={user?.avatar || ''} seed={user?.name || user?.id || ''} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="settings" size={rw(24)} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
