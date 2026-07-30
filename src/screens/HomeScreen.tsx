import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { ContentRow } from '../components/ContentRow';
import { Screen } from '../components/Screen';
import {
  getEpisodesByCategory,
  FALLBACK_THUMB,
  type Episode,
} from '../data/catalog';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { desktopSpacing, useIsDesktopWeb } from '../layout/desktop';
import { openSubscribeWeb } from '../lib/openSubscribeWeb';
import { colors } from '../theme/colors';
import { TVFocusGuide, isTV } from '../tv';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { user, hasActiveSubscription } = useAuth();
  const { episodes, categories, isLoading, error, refresh } = useCatalog();
  const insets = useSafeAreaInsets();
  const isDesktop = useIsDesktopWeb();
  const featured =
    episodes.find((item) => item.isLive) ?? episodes[0] ?? null;
  const pad = isDesktop ? desktopSpacing.screenPad : 20;

  const onSelect = (episode: Episode) => {
    navigation.navigate('ContentDetail', {
      episodeId: episode.id,
      kind: episode.kind,
    });
  };

  const onSubscribe = () => {
    void openSubscribeWeb(user?.email);
  };

  return (
    <Screen edges={['left', 'right']} style={styles.root}>
      <StatusBar style="light" />
      <ScrollView>
        <ImageBackground
          source={{ uri: featured?.thumbnailUrl ?? FALLBACK_THUMB }}
          style={[
            styles.hero,
            isDesktop && styles.heroDesktop,
            { paddingTop: isDesktop ? 28 : insets.top + 12 },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(9,10,13,0.55)', colors.background]}
            style={[
              styles.heroGradient,
              isDesktop && styles.heroGradientDesktop,
              { paddingHorizontal: pad },
            ]}
          >
            <Text style={[styles.brand, isDesktop && styles.brandDesktop]}>
              STU & LAURIE
            </Text>
            <Text style={styles.greeting}>
              Welcome back, {user?.name ?? 'fan'}
            </Text>
            {featured ? (
              <>
                <Text
                  style={[
                    styles.heroTitle,
                    isDesktop && styles.heroTitleDesktop,
                  ]}
                >
                  {featured.title}
                </Text>
                <Text
                  style={[styles.heroCopy, isDesktop && styles.heroCopyDesktop]}
                  numberOfLines={isDesktop ? 4 : 3}
                >
                  {featured.description}
                </Text>
                <TVFocusGuide autoFocus={!isTV}>
                  <View style={styles.heroActions}>
                    <AppButton
                      label={featured.isLive ? 'Watch Live' : 'Play Featured'}
                      onPress={() => onSelect(featured)}
                      style={styles.cta}
                      preferredFocus
                    />
                    {!hasActiveSubscription ? (
                      <Pressable
                        accessibilityRole="link"
                        accessibilityLabel="Subscribe on the web"
                        onPress={onSubscribe}
                        style={({ pressed }) => [
                          styles.subscribeLink,
                          pressed && styles.subscribeLinkPressed,
                        ]}
                      >
                        <Text style={styles.subscribeLinkText}>
                          Membership · from web
                        </Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.memberBadge}>
                        Member access active
                      </Text>
                    )}
                  </View>
                </TVFocusGuide>
              </>
            ) : (
              <View style={styles.emptyHero}>
                {isLoading ? (
                  <ActivityIndicator color={colors.accent} />
                ) : (
                  <>
                    <Text style={styles.heroTitle}>
                      {error ? 'Catalog unavailable' : 'No titles yet'}
                    </Text>
                    <Text style={styles.heroCopy}>
                      {error ??
                        'Videos and live events will appear here when published.'}
                    </Text>
                    <AppButton label="Retry" onPress={() => void refresh()} />
                  </>
                )}
              </View>
            )}
          </LinearGradient>
        </ImageBackground>

        {categories.map((category, index) => (
          <ContentRow
            key={category}
            title={category}
            episodes={getEpisodesByCategory(episodes, category)}
            onSelect={onSelect}
            preferredFocusFirst={isTV && index === 0}
          />
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hero: {
    minHeight: 440,
    marginBottom: 8,
  },
  heroDesktop: {
    minHeight: desktopSpacing.heroMinHeight,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 28,
    minHeight: 360,
  },
  heroGradientDesktop: {
    paddingBottom: 48,
    minHeight: desktopSpacing.heroMinHeight,
  },
  brand: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: colors.accent,
    letterSpacing: 3,
    marginBottom: 18,
  },
  brandDesktop: {
    fontSize: 28,
    letterSpacing: 4,
    marginBottom: 24,
  },
  greeting: {
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 40,
    color: colors.text,
    letterSpacing: 1,
    lineHeight: 42,
  },
  heroTitleDesktop: {
    fontSize: 64,
    lineHeight: 66,
    maxWidth: 720,
  },
  heroCopy: {
    marginTop: 8,
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 520,
  },
  heroCopyDesktop: {
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 560,
    marginTop: 12,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    flexWrap: 'wrap',
  },
  emptyHero: {
    marginTop: 8,
    gap: 12,
    maxWidth: 480,
  },
  cta: {
    minWidth: 140,
  },
  subscribeLink: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  subscribeLinkPressed: {
    opacity: 0.7,
  },
  subscribeLinkText: {
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    textDecorationLine: 'underline',
    textDecorationColor: colors.border,
  },
  memberBadge: {
    color: colors.success,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
  },
  bottomSpacer: {
    height: 24,
  },
});
