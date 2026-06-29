// AsyncStorage is mapped via moduleNameMapper in jest.config.js
// @testing-library/react-native v13+ includes matchers automatically — no extend-expect needed

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'es', regionCode: 'ES' }]),
  getCalendars: jest.fn(() => []),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { hostUri: '' } },
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  })),
  useSegments: jest.fn(() => []),
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  Stack: { Screen: ({ children }: any) => children },
  Tabs: { Screen: ({ children }: any) => children },
  Link: ({ children }: any) => children,
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// @expo/vector-icons is mapped via moduleNameMapper in jest.config.js

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  useNetInfo: jest.fn(() => ({ isConnected: true })),
}));

jest.mock('@/services/mockData', () => ({
  getProfileAvatar: jest.fn((id: string) => 'avatar_01'),
}));
