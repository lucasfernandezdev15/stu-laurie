import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { Screen } from '../components/Screen';
import { getEpisodeById } from '../data/catalog';
import { useAuth } from '../context/AuthContext';
import { desktopSpacing, useIsDesktopWeb } from '../layout/desktop';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ContentDetail'>;

export function ContentDetailScreen({ navigation, route }: Props) {
  const { hasActiveSubscription } = useAuth();
  const isDesktop = useIsDesktopWeb();
  const episode = getEpisodeById(route.params.episodeId);

  if (!episode) {
    return (
      <Screen>
        <Text style={styles.missing}>Content not found.</Text>
        <AppButton label="Go back" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const isLocked = episode.isPremium && !hasActiveSubscription;

  const onPlay = () => {
    if (isLocked) {
      navigation.navigate('Subscribe');
      return;
    }
    navigation.navigate('Player', { episodeId: episode.id });
  };

  const body = (
    <View
      style={[
        styles.body,
        isDesktop && styles.bodyDesktop,
        isDesktop && { paddingHorizontal: desktopSpacing.screenPad },
      ]}
    >
      <Text style={styles.category}>{episode.category.toUpperCase()}</Text>
      <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
        {episode.title}
      </Text>
      <Text style={styles.meta}>
        {episode.durationMinutes} min
        {episode.isLive ? ' · LIVE' : ''}
        {episode.isPremium ? ' · Premium' : ' · Free'}
        {` · ${episode.format.toUpperCase()}`}
      </Text>
      <Text style={styles.delivery}>{episode.deliveryNote}</Text>
      <Text style={styles.description}>{episode.description}</Text>
      {episode.guests?.length ? (
        <Text style={styles.guests}>Guests: {episode.guests.join(', ')}</Text>
      ) : null}

      <AppButton
        label={isLocked ? 'Unlock with subscription' : 'Play'}
        onPress={onPlay}
        style={styles.play}
      />
      <AppButton
        label="Back"
        variant="ghost"
        onPress={() => navigation.goBack()}
      />
    </View>
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={isDesktop && styles.desktopScroll}>
        {isDesktop ? (
          <View style={styles.desktopSplit}>
            <Image
              source={{ uri: episode.thumbnailUrl }}
              style={styles.coverDesktop}
            />
            {body}
          </View>
        ) : (
          <>
            <Image
              source={{ uri: episode.thumbnailUrl }}
              style={styles.cover}
            />
            {body}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceElevated,
  },
  coverDesktop: {
    flex: 1.1,
    minHeight: 360,
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceElevated,
  },
  desktopScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: desktopSpacing.screenPad,
  },
  desktopSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  body: {
    padding: 20,
    maxWidth: 720,
  },
  bodyDesktop: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 8,
    maxWidth: 520,
  },
  category: {
    color: colors.accent,
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 8,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 36,
    color: colors.text,
    letterSpacing: 1,
  },
  titleDesktop: {
    fontSize: 48,
  },
  meta: {
    marginTop: 6,
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
  },
  delivery: {
    marginTop: 8,
    color: colors.accentDim,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
  },
  description: {
    marginTop: 16,
    color: colors.text,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  guests: {
    marginTop: 12,
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
  },
  play: {
    marginTop: 24,
  },
  missing: {
    color: colors.text,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 16,
    margin: 24,
  },
});
