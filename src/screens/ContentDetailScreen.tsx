import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { Screen } from '../components/Screen';
import type { Episode } from '../data/catalog';
import { playbackUnavailableLabel } from '../data/catalog';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { PREMIUM_ON_HOLD } from '../config/features';
import { desktopSpacing, useIsDesktopWeb } from '../layout/desktop';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ContentDetail'>;

export function ContentDetailScreen({ navigation, route }: Props) {
  const { hasActiveSubscription } = useAuth();
  const { getById, resolveEpisode } = useCatalog();
  const isDesktop = useIsDesktopWeb();
  const cached = getById(route.params.episodeId);
  const [episode, setEpisode] = useState<Episode | null>(cached ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let mounted = true;
    if (cached) {
      setEpisode(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    void resolveEpisode(route.params.episodeId, route.params.kind)
      .then((item) => {
        if (mounted) {
          setEpisode(item);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : 'Content not found.',
          );
          setEpisode(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [cached, resolveEpisode, route.params.episodeId, route.params.kind]);

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </Screen>
    );
  }

  if (!episode) {
    return (
      <Screen>
        <Text style={styles.missing}>{error ?? 'Content not found.'}</Text>
        <AppButton label="Go back" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const isLocked =
    !PREMIUM_ON_HOLD && episode.isPremium && !hasActiveSubscription;
  const playBlocked = !episode.canPlay;

  const onPlay = () => {
    if (playBlocked) {
      return;
    }
    if (isLocked) {
      navigation.navigate('Subscribe');
      return;
    }
    navigation.navigate('Player', {
      episodeId: episode.id,
      kind: episode.kind,
    });
  };

  const playLabel = playBlocked
    ? 'Not ready yet'
    : isLocked
      ? 'Unlock with subscription'
      : 'Play';

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
        {episode.durationMinutes > 0 ? `${episode.durationMinutes} min · ` : ''}
        {episode.isLive ? 'LIVE · ' : ''}
        {!PREMIUM_ON_HOLD ? (episode.isPremium ? 'Premium' : 'Free') : ''}
        {!PREMIUM_ON_HOLD ? ` · ${episode.format.toUpperCase()}` : episode.format.toUpperCase()}
      </Text>
      <Text style={styles.delivery}>{episode.deliveryNote}</Text>
      <Text style={styles.description}>{episode.description}</Text>
      {episode.guests?.length ? (
        <Text style={styles.guests}>Guests: {episode.guests.join(', ')}</Text>
      ) : null}
      {playBlocked ? (
        <Text style={styles.statusNote}>
          {playbackUnavailableLabel(episode)}
        </Text>
      ) : null}

      <AppButton
        label={playLabel}
        onPress={onPlay}
        disabled={playBlocked}
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  statusNote: {
    marginTop: 16,
    color: colors.spotlight,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    lineHeight: 20,
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
