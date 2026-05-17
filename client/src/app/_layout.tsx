import { useEffect } from 'react';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Image } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

function RootGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const rootSegment = segments[0] as string | undefined;
    const inAuthGroup = rootSegment === 'auth';
    const inTabsGroup = rootSegment === 'tabs';
    const inHome = rootSegment === 'home';

    if (!isAuthenticated) {
      if (!inAuthGroup && !inHome) {
        router.replace('/home' as Href);
      }
    } else if (inAuthGroup || inHome) {
      router.replace('/tabs/profile');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Image source={require('../../assets/Splash.gif')} style={{ width: 220, height: 220 }} resizeMode="contain" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="tabs" />
      <Stack.Screen
        name="game/[gameId]"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <StatusBarWrapper />
            <RootGuard />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function StatusBarWrapper() {
  const { theme } = useTheme();
  return <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />;
}
