import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { VideoSource } from 'expo-video';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import {
  ExpoPlayerSurface,
  type PlayerSurfaceRef,
} from '../components/ExpoPlayerSurface';
import type { WebHlsPlayerRef } from '../components/WebHlsPlayer';
import { WebHlsPlayer } from '../components/WebHlsPlayer';
import { YouTubePlayer } from '../components/YouTubePlayer';
import type { Episode } from '../data/catalog';
import { playbackUnavailableLabel } from '../data/catalog';
import { ApiError } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { PREMIUM_ON_HOLD } from '../config/features';
import { colors } from '../theme/colors';
import { TVFocusGuide, isTV } from '../tv';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

type HWEvent = {
  eventType: string;
  eventKeyAction?: number;
};

function useTVEventHandlerFallback(_handler: (event: HWEvent) => void) {
  // no-op outside react-native-tvos
}

const useTVEventHandler: (handler: (event: HWEvent) => void) => void =
  (
    require('react-native') as {
      useTVEventHandler?: (handler: (event: HWEvent) => void) => void;
    }
  ).useTVEventHandler ?? useTVEventHandlerFallback;

type PlaybackState = {
  episode: Episode;
  url: string;
  format: Episode['format'];
};

export function PlayerScreen({ navigation, route }: Props) {
  const { hasActiveSubscription } = useAuth();
  const { getById, resolveEpisode, resolvePlayback } = useCatalog();
  const insets = useSafeAreaInsets();
  const expoRef = useRef<PlayerSurfaceRef>(null);
  const webHlsRef = useRef<WebHlsPlayerRef>(null);

  const [episode, setEpisode] = useState<Episode | null>(
    () => getById(route.params.episodeId) ?? null,
  );
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const useYouTube = playback?.format === 'youtube';
  const useWebHls =
    Platform.OS === 'web' && playback?.format === 'hls';
  const useExpo =
    !!playback && !useYouTube && !useWebHls;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setBooting(true);
      setBootError(null);
      setError(null);
      setPlayback(null);
      try {
        const item =
          episode ??
          (await resolveEpisode(route.params.episodeId, route.params.kind));
        if (!mounted) {
          return;
        }
        setEpisode(item);

        if (
          !PREMIUM_ON_HOLD &&
          item.isPremium &&
          !hasActiveSubscription
        ) {
          setBooting(false);
          return;
        }

        const playbackInfo = await resolvePlayback(item);
        if (!mounted) {
          return;
        }
        const nextEpisode = {
          ...item,
          videoUrl: playbackInfo.url,
          format: playbackInfo.format,
          isLive: playbackInfo.isLive ?? item.isLive,
        };
        setEpisode(nextEpisode);
        setPlayback({
          episode: nextEpisode,
          url: playbackInfo.url,
          format: playbackInfo.format,
        });
      } catch (err) {
        if (mounted) {
          const fallback =
            getById(route.params.episodeId) ?? episode ?? null;
          setBootError(resolvePlaybackError(err, fallback));
        }
      } finally {
        if (mounted) {
          setBooting(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasActiveSubscription,
    resolveEpisode,
    resolvePlayback,
    route.params.episodeId,
    route.params.kind,
  ]);

  const handlePlayerError = useCallback((message: string) => {
    setError(message.trim() ? message : null);
  }, []);

  const togglePlay = useCallback(() => {
    if (useYouTube) {
      return;
    }
    const surface = useWebHls ? webHlsRef.current : expoRef.current;
    if (isPlaying) {
      surface?.pause();
    } else {
      surface?.play();
    }
  }, [isPlaying, useWebHls, useYouTube]);

  const enterFullscreen = useCallback(() => {
    if (useYouTube) {
      return;
    }
    const surface = useWebHls ? webHlsRef.current : expoRef.current;
    void surface?.enterFullscreen();
  }, [useWebHls, useYouTube]);

  useTVEventHandler(
    useCallback(
      (event: HWEvent) => {
        if (event.eventType === 'playPause' || event.eventType === 'select') {
          togglePlay();
        }
        if (event.eventType === 'menu') {
          navigation.goBack();
        }
      },
      [navigation, togglePlay],
    ),
  );

  if (booting) {
    return (
      <View style={styles.root}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (bootError || !episode || !playback) {
    return (
      <View style={styles.root}>
        <Text style={styles.error}>
          {bootError ?? 'Episode unavailable.'}
        </Text>
        <AppButton label="Close" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  if (
    !PREMIUM_ON_HOLD &&
    episode.isPremium &&
    !hasActiveSubscription
  ) {
    return (
      <View style={styles.root}>
        <Text style={styles.error}>
          This title requires an active subscription.
        </Text>
        <AppButton
          label="Subscribe"
          onPress={() => navigation.replace('Subscribe')}
          style={styles.lockedCta}
          preferredFocus
        />
        <AppButton
          label="Back"
          variant="ghost"
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  const expoSource: VideoSource = {
    uri: playback.url,
    contentType: playback.format === 'hls' ? 'hls' : undefined,
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden />
      <TVFocusGuide
        style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}
      >
        <Text style={styles.title} numberOfLines={1}>
          {episode.isLive ? '● LIVE  ' : ''}
          {episode.title}
        </Text>
        <AppButton
          label={isPlaying ? 'Pause' : 'Play'}
          variant="secondary"
          onPress={togglePlay}
          style={styles.close}
          preferredFocus={isTV}
          disabled={useYouTube}
        />
        {!isTV && !useYouTube ? (
          <AppButton
            label="Fullscreen"
            variant="secondary"
            onPress={enterFullscreen}
            style={styles.close}
          />
        ) : null}
        <AppButton
          label="Close"
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={styles.close}
        />
      </TVFocusGuide>
      <View style={styles.playerWrap}>
        {useYouTube ? (
          <YouTubePlayer
            url={playback.url}
            autoPlay
            style={styles.video}
            onError={(msg) => handlePlayerError(msg)}
            onReady={() => handlePlayerError('')}
          />
        ) : useWebHls ? (
          <WebHlsPlayer
            ref={webHlsRef}
            url={playback.url}
            autoPlay
            nativeControls={!isTV}
            style={styles.video}
            onError={(msg) => handlePlayerError(msg)}
            onReady={() => handlePlayerError('')}
            onPlayingChange={setIsPlaying}
          />
        ) : useExpo ? (
          <ExpoPlayerSurface
            ref={expoRef}
            source={expoSource}
            onError={handlePlayerError}
            onPlayingChange={setIsPlaying}
          />
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isTV ? (
        <Text style={styles.tvHint}>
          Remote: OK / Play-Pause · Menu to exit
        </Text>
      ) : null}
    </View>
  );
}

function resolvePlaybackError(err: unknown, episode: Episode | null): string {
  if (err instanceof ApiError) {
    if (err.status === 404 && episode) {
      return playbackUnavailableLabel(episode);
    }
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'No se pudo preparar el playback.';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  title: {
    flex: 1,
    color: colors.text,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: isTV ? 22 : 16,
  },
  close: {
    minHeight: 40,
    paddingHorizontal: 14,
  },
  playerWrap: {
    flex: 1,
    width: '100%',
  },
  video: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  error: {
    color: colors.spotlight,
    textAlign: 'center',
    marginTop: 12,
    marginHorizontal: 24,
    fontFamily: 'SourceSans3_400Regular',
  },
  lockedCta: {
    marginHorizontal: 24,
    marginTop: 16,
  },
  tvHint: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    textAlign: 'center',
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
  },
});
