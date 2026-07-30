import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useEvent, useEventListener } from 'expo';
import {
  useVideoPlayer,
  VideoView,
  type VideoSource,
} from 'expo-video';
import { colors } from '../theme/colors';
import { isTV } from '../tv';

export type PlayerSurfaceRef = {
  play: () => void;
  pause: () => void;
  enterFullscreen: () => Promise<void>;
};

type Props = {
  source: VideoSource;
  onError: (message: string) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
};

export const ExpoPlayerSurface = forwardRef<PlayerSurfaceRef, Props>(
  function ExpoPlayerSurface({ source, onError, onPlayingChange }, ref) {
    const videoRef = useRef<VideoView>(null);
    const player = useVideoPlayer(source, (instance) => {
      instance.play();
    });

    const { status } = useEvent(player, 'statusChange', {
      status: player.status,
    });

    useEventListener(player, 'statusChange', ({ status: nextStatus }) => {
      if (nextStatus === 'error') {
        onError('No se pudo reproducir el video. Revisá la conexión.');
      }
    });

    useEventListener(player, 'playingChange', ({ isPlaying }) => {
      onPlayingChange?.(isPlaying);
    });

    useImperativeHandle(ref, () => ({
      play: () => player.play(),
      pause: () => player.pause(),
      enterFullscreen: async () => {
        await videoRef.current?.enterFullscreen();
      },
    }));

    const isBuffering = status === 'loading' || status === 'idle';

    return (
      <View style={styles.wrap}>
        {isBuffering ? (
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
          onFirstFrameRender={() => onError('')}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
  },
  video: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  spinner: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1,
    top: '45%',
  },
});
