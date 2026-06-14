import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Animated, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

const SPLASH_MIN_MS = 2500;
const SPLASH_FADE_MS = 600;

function RootGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const authDone = useRef(false);
  const timerDone = useRef(false);

  const tryHideSplash = () => {
    if (!authDone.current || !timerDone.current) return;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: SPLASH_FADE_MS,
      useNativeDriver: true,
    }).start(() => setShowSplash(false));
  };

  useEffect(() => {
    const t = setTimeout(() => {
      timerDone.current = true;
      tryHideSplash();
    }, SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      authDone.current = true;
      tryHideSplash();
    }
  }, [isLoading]);

  useEffect(() => {
    if (showSplash || isLoading) return;

    const rootSegment = segments[0] as string | undefined;
    const inAuthGroup = rootSegment === 'auth';
    const inHome = rootSegment === 'home';

    if (!isAuthenticated) {
      if (!inAuthGroup && !inHome) {
        router.replace('/home' as Href);
      }
    } else if (inAuthGroup || inHome) {
      router.replace('/tabs/profile');
    }
  }, [showSplash, isAuthenticated, isLoading, segments]);

  return (
    <>
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

      {showSplash && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: colors.background,
            opacity: fadeAnim,
          }}
        >
          <Image
            source={require('../../assets/Splash.gif')}
            style={{
              width: Dimensions.get('window').width,
              height: Dimensions.get('window').height,
            }}
            contentFit="cover"
            autoplay
          />
        </Animated.View>
      )}
    </>
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
