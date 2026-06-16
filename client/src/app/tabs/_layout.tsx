import { Tabs } from 'expo-router';
import { View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { rw, rh, rf } from '@/utils/responsive';
import { resolveAvatarSource } from '@/constants/avatars';

const AVATAR_SIZE = rw(54);
const AVATAR_LIFT = rh(22);

function AvatarTabIcon({ focused, avatar, colors, seed }: { focused: boolean; avatar: string; colors: any; seed: string }) {
  const avatarSource = resolveAvatarSource(avatar, seed);
  return (
    <View style={{
      width:           AVATAR_SIZE + 10,
      height:          AVATAR_SIZE + 10,
      borderRadius:    (AVATAR_SIZE + 10) / 2,
      borderWidth:     3,
      borderColor:     focused ? colors.purple : colors.cardBorder,
      backgroundColor: colors.card,
      alignItems:      'center',
      justifyContent:  'center',
      transform:       [{ translateY: -AVATAR_LIFT }],
      shadowColor:     colors.purple,
      shadowOffset:    { width: 0, height: focused ? -4 : -2 },
      shadowOpacity:   focused ? 0.55 : 0.15,
      shadowRadius:    focused ? 10 : 4,
      elevation:       focused ? 10 : 4,
    }}>
      <Image
        source={avatarSource}
        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }}
      />
    </View>
  );
}

export default function TabsLayout() {
  const { user }   = useAuth();
  const { colors } = useTheme();
  const { t }      = useTranslation();
  const insets     = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor:  'transparent',
          borderTopWidth:  0,
          height:          rh(72) + insets.bottom,
          paddingBottom:   insets.bottom + rh(12),
          paddingTop:      rh(8),
          overflow:        'visible',
          elevation:       0,
          shadowOpacity:   0,
        },
        tabBarActiveTintColor:   colors.purple,
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
          tabBarItemStyle: { overflow: 'visible' },
          tabBarIcon: ({ focused }) => (
            <AvatarTabIcon
              focused={focused}
              avatar={user?.avatar || ''}
              seed={user?.name || user?.id || ''}
              colors={colors}
            />
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
