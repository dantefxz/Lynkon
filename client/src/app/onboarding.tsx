import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, ViewToken, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { rw, rh, rf, rs } from '@/utils/responsive';
import { track } from '@/services/analytics';

const { width } = Dimensions.get('window');

type Slide = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  titleKey: string;
  descKey: string;
  color: string;
};

const SLIDES: Slide[] = [
  {
    key:      'welcome',
    icon:     'sports-esports',
    titleKey: 'onboarding.slide1.title',
    descKey:  'onboarding.slide1.desc',
    color:    '#7C3AED',
  },
  {
    key:      'platforms',
    icon:     'link',
    titleKey: 'onboarding.slide2.title',
    descKey:  'onboarding.slide2.desc',
    color:    '#2563EB',
  },
  {
    key:      'discover',
    icon:     'people',
    titleKey: 'onboarding.slide3.title',
    descKey:  'onboarding.slide3.desc',
    color:    '#059669',
  },
];

export default function OnboardingScreen() {
  const router   = useRouter();
  const { colors } = useTheme();
  const { t }    = useTranslation();
  const listRef  = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]) setIndex(viewableItems[0].index ?? 0);
    },
  ).current;

  const finish = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    track('onboarding_completed');
    router.replace('/home');
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  const skip = () => {
    track('onboarding_skipped', { slide: index });
    finish();
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" />

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={skip}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
              <MaterialIcons name={item.icon} size={rw(72)} color={item.color} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t(item.titleKey)}</Text>
            <Text style={[styles.desc, { color: colors.textMuted }]}>{t(item.descKey)}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            style={[
              styles.dot,
              { backgroundColor: i === index ? colors.purple : colors.border },
              i === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Next / Comenzar */}
      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: colors.purple }]}
        onPress={next}
        activeOpacity={0.85}
      >
        <Text style={styles.nextText}>
          {isLast ? t('onboarding.start') : t('onboarding.next')}
        </Text>
        {!isLast && (
          <MaterialIcons name="arrow-forward" size={rw(20)} color="#fff" />
        )}
      </TouchableOpacity>

      <View style={{ height: rh(24) }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1 },
  skipBtn:    { alignSelf: 'flex-end', padding: rs.md, marginTop: rh(8) },
  skipText:   { fontSize: rf(14) },
  slide:      {
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: rs.xl,
    paddingTop:      rh(40),
    gap:             rh(28),
  },
  iconCircle: {
    width:          rw(160),
    height:         rw(160),
    borderRadius:   rw(80),
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   rh(8),
  },
  title: {
    fontSize:   rf(26),
    fontWeight: '700',
    textAlign:  'center',
  },
  desc: {
    fontSize:   rf(15),
    textAlign:  'center',
    lineHeight: rf(24),
  },
  dotsRow:   { flexDirection: 'row', justifyContent: 'center', gap: rw(8), marginVertical: rh(28) },
  dot:       { width: rw(8), height: rw(8), borderRadius: rw(4) },
  dotActive: { width: rw(24) },
  nextBtn:   {
    marginHorizontal: rs.xl,
    paddingVertical:  rh(16),
    borderRadius:     rw(14),
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              rw(8),
  },
  nextText: { color: '#fff', fontSize: rf(16), fontWeight: '600' },
});
