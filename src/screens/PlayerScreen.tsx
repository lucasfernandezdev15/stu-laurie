import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { getEpisodeById } from '../data/catalog';
import { useAuth } from '../context/AuthContext';
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

export function PlayerScreen({ navigation, route }: Props) {
  const episode = getEpisodeById(route.params.episodeId);
  const { hasActiveSubscription } = useAuth();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<VideoView>(null);
  const [error, setError] = useState<string | null>(null);

  const canPlay =
    !!episode && !(episode.isPremium && !hasActiveSubscription);

  const videoSource: VideoSource | null =
    canPlay && episode
      ? {
          uri: episode.videoUrl,
          contentType: episode.format === 'hls' ? 'hls' : undefined,
        }
      : null;

  const player = useVideoPlayer(videoSource, (instance) => {
    instance.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });
  const { status } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  useEventListener(player, 'statusChange', ({ status: nextStatus }) => {
    if (nextStatus === 'error') {
      setError(
        episode?.format === 'hls' && Platform.OS === 'web'
          ? 'Este HLS no reprodujo en este browser. Probá Safari, o un título MP4 (Highlights).'
          : 'No se pudo reproducir el video. Revisá la conexión.',
      );
    }
  });

  const isBuffering = status === 'loading' || status === 'idle';

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  const enterFullscreen = useCallback(() => {
    void videoRef.current?.enterFullscreen();
  }, []);

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

  if (!episode) {
    return (
      <View style={styles.root}>
        <Text style={styles.error}>Episode unavailable.</Text>
        <AppButton label="Close" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  if (episode.isPremium && !hasActiveSubscription) {
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

  const webHlsTip =
    Platform.OS === 'web' && episode.format === 'hls'
      ? 'HLS en web: mejor en Safari. En Chrome puede fallar; usá Highlights (MP4) o device nativo.'
      : null;

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
        />
        {!isTV ? (
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
        {isBuffering && !error ? (
          <ActivityIndicator
            color={colors.accent}
            size="large"
            style={styles.spinner}
          />
        ) : null}
        <VideoView
          ref={videoRef}
          style={styles.video}
          player={player}
          contentFit="contain"
          nativeControls={!isTV}
          fullscreenOptions={{ enable: true }}
          onFirstFrameRender={() => setError(null)}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {webHlsTip && !error ? (
        <Text style={styles.tvHint}>{webHlsTip}</Text>
      ) : null}
      {isTV ? (
        <Text style={styles.tvHint}>
          Remote: OK / Play-Pause · Menu to exit
        </Text>
      ) : null}
    </View>
  );
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  spinner: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1,
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
