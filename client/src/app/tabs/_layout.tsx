import { Tabs } from 'expo-router';
import { View, Image, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { rw, rh, rf } from '@/utils/responsive';

function AvatarTabIcon({ focused, avatar, colors }: { focused: boolean; avatar: string; colors: any }) {
  const size = rw(48);
  return (
    <View style={[
      { width: size, height: size, borderRadius: size / 2, borderWidth: 2, overflow: 'hidden' },
      focused
        ? { borderColor: colors.purple, shadowColor: colors.purple, shadowOpacity: 0.6, shadowRadius: 8, elevation: 6 }
        : { borderColor: colors.textMuted },
    ]}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.purpleDim }}>
          <MaterialIcons name="person-outline" size={rw(20)} color={colors.purple} />
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { user } = useAuth();
  const { colors } = useTheme();

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
          title: 'Social',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'forum' : 'chat-bubble-outline'} size={rw(24)} color={color} />
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
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <AvatarTabIcon focused={focused} avatar={user?.avatar || ''} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name={focused ? 'settings' : 'settings'} size={rw(24)} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
