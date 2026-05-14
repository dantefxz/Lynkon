// src/navigation/AppNavigator.jsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

import { LoginScreen }          from '../screens/LoginScreen';
import { RegisterScreen }       from '../screens/RegisterScreen';
import { HomeScreen }           from '../screens/HomeScreen';
import { ProfileScreen }        from '../screens/ProfileScreen';
import { SocialScreen }         from '../screens/SocialScreen';
import { ChatScreen }           from '../screens/ChatScreen';
import { SettingsScreen }       from '../screens/SettingsScreen';
import { LinkPlatformScreen }   from '../screens/LinkPlatformScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = { Home: '🎮', Social: '👥', Profile: '👤' };
const TAB_LABELS = { Home: 'Juegos', Social: 'Social', Profile: 'Perfil' };

const screenOptions = {
  headerStyle:       { backgroundColor: colors.card },
  headerTintColor:   colors.text,
  headerShadowVisible: false,
  headerTitleStyle:  { fontWeight: '700', fontSize: 17 },
  contentStyle:      { backgroundColor: colors.background },
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Mi biblioteca' }} />
    </Stack.Navigator>
  );
}

function SocialStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="SocialMain" component={SocialScreen} options={{ title: 'Social' }} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params?.friend?.name || route.params?.friend?.username || 'Chat' })}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ProfileMain"    component={ProfileScreen}      options={{ title: 'Mi perfil' }} />
      <Stack.Screen name="Settings"       component={SettingsScreen}     options={{ title: 'Configuración' }} />
      <Stack.Screen name="LinkPlatform"   component={LinkPlatformScreen} options={{ title: 'Vincular plataforma' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor:  colors.border,
          borderTopWidth:  1,
          height:          60,
          paddingBottom:   8,
        },
        tabBarActiveTintColor:   colors.purpleLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarLabel: TAB_LABELS[route.name] || route.name,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home"    component={HomeStack} />
      <Tab.Screen name="Social"  component={SocialStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated } = useAuth();
  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
