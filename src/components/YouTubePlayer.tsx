import { useEffect } from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { AppButton } from './AppButton';
import { YOUTUBE_EMBED_ON_HOLD } from '../config/features';
import {
  extractYouTubeVideoId,
  youtubeEmbedUrl,
} from '../lib/youtube';
import { colors } from '../theme/colors';

type Props = {
  url: string;
  autoPlay?: boolean;
  style?: ViewStyle;
  onError?: (message: string) => void;
  onReady?: () => void;
};

/**
 * YouTube cannot play in &lt;video&gt; / HLS.
 * Embed is optional (often blocked by the video owner); default is open externally.
 */
export function YouTubePlayer({
  url,
  autoPlay = true,
  style,
  onError,
  onReady,
}: Props) {
  const videoId = extractYouTubeVideoId(url);
  const watchUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : url;

  useEffect(() => {
    if (!videoId) {
      onError?.('URL de YouTube inválida.');
      return;
    }
    onReady?.();
  }, [videoId, onError, onReady]);

  if (!videoId) {
    return (
      <View style={[styles.wrap, style]}>
        <Text style={styles.message}>URL de YouTube inválida.</Text>
      </View>
    );
  }

  const useEmbed =
    Platform.OS === 'web' && !YOUTUBE_EMBED_ON_HOLD;

  if (useEmbed) {
    const embed = youtubeEmbedUrl(videoId, { autoplay: autoPlay });
    return (
      <View style={[styles.wrap, style]}>
        {createWebIframe(embed)}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, styles.nativeFallback, style]}>
      <Text style={styles.message}>
        YouTube embed está en pausa (muchos videos bloquean reproducción en
        otros sitios). Abrilo en YouTube.
      </Text>
      <AppButton
        label="Open on YouTube"
        onPress={() => void Linking.openURL(watchUrl)}
        style={styles.cta}
      />
    </View>
  );
}

function createWebIframe(src: string) {
  const React = require('react') as typeof import('react');
  return React.createElement('iframe', {
    src,
    title: 'YouTube player',
    allow:
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    allowFullScreen: true,
    style: {
      border: 0,
      width: '100%',
      height: '100%',
    },
  });
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  nativeFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  message: {
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    minWidth: 200,
  },
});
