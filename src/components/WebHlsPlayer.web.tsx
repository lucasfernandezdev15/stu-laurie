import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Hls from 'hls.js';

export type WebHlsPlayerRef = {
  play: () => void;
  pause: () => void;
  enterFullscreen: () => Promise<void>;
};

type Props = {
  url: string;
  autoPlay?: boolean;
  nativeControls?: boolean;
  style?: ViewStyle;
  onError?: (message: string) => void;
  onReady?: () => void;
  onPlayingChange?: (isPlaying: boolean) => void;
};

function supportsNativeHls(video: HTMLVideoElement): boolean {
  return (
    video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
    video.canPlayType('application/x-mpegURL') !== ''
  );
}

export const WebHlsPlayer = forwardRef<WebHlsPlayerRef, Props>(
  function WebHlsPlayer(
    {
      url,
      autoPlay = true,
      nativeControls = true,
      style,
      onError,
      onReady,
      onPlayingChange,
    },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    useImperativeHandle(ref, () => ({
      play: () => {
        void videoRef.current?.play();
      },
      pause: () => {
        videoRef.current?.pause();
      },
      enterFullscreen: async () => {
        const video = videoRef.current as HTMLVideoElement & {
          webkitRequestFullscreen?: () => Promise<void>;
        };
        if (!video) {
          return;
        }
        if (video.requestFullscreen) {
          await video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
          await video.webkitRequestFullscreen();
        }
      },
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !url) {
        return;
      }

      let disposed = false;

      const cleanup = () => {
        hlsRef.current?.destroy();
        hlsRef.current = null;
        video.removeAttribute('src');
        video.load();
      };

      const handleError = (message: string) => {
        if (!disposed) {
          onError?.(message);
        }
      };

      video.onplay = () => onPlayingChange?.(true);
      video.onpause = () => onPlayingChange?.(false);
      video.onplaying = () => onReady?.();

      if (supportsNativeHls(video)) {
        video.src = url;
        video.load();
        if (autoPlay) {
          void video.play().catch(() => {
            handleError('No se pudo iniciar la reproducción.');
          });
        }
        return cleanup;
      }

      if (!Hls.isSupported()) {
        handleError(
          'HLS no es compatible con este browser. Probá Chrome actualizado o Safari.',
        );
        return cleanup;
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          handleError(
            data.type === Hls.ErrorTypes.NETWORK_ERROR
              ? 'Error de red al cargar el stream HLS.'
              : 'No se pudo reproducir el stream HLS.',
          );
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          void video.play().catch(() => {
            handleError('No se pudo iniciar la reproducción.');
          });
        }
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      return () => {
        disposed = true;
        cleanup();
      };
    }, [url, autoPlay, onError, onReady, onPlayingChange]);

    // Browser / native controls already show buffering — one spinner only.
    return (
      <View style={[styles.wrap, style]}>
        <video
          ref={videoRef}
          controls={nativeControls}
          playsInline
          style={styles.video}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    objectFit: 'contain',
  } as object,
});
