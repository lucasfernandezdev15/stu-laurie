import { forwardRef } from 'react';
import type { ViewStyle } from 'react-native';

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

/** Native stub — HLS on web is handled by WebHlsPlayer.web.tsx */
export const WebHlsPlayer = forwardRef<WebHlsPlayerRef, Props>(
  function WebHlsPlayerStub(_props, _ref) {
    return null;
  },
);
