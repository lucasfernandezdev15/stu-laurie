import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { Episode } from '../data/catalog';
import { PREMIUM_ON_HOLD, VIDEO_STATUS_GATE_ON_HOLD } from '../config/features';
import { colors } from '../theme/colors';
import { isTV, tvScale } from '../tv/platform';

interface ContentCardProps {
  episode: Episode;
  onPress: (episode: Episode) => void;
  style?: StyleProp<ViewStyle>;
  width?: number;
  preferredFocus?: boolean;
}

export function ContentCard({
  episode,
  onPress,
  style,
  width = 168,
  preferredFocus = false,
}: ContentCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={episode.title}
      onPress={() => onPress(episode)}
      hasTVPreferredFocus={isTV ? preferredFocus : undefined}
      style={(state) => {
        const focused = Boolean(
          (state as { focused?: boolean }).focused,
        );
        return [
          styles.card,
          { width },
          state.pressed && styles.pressed,
          focused && styles.focused,
          style,
        ];
      }}
    >
      <View style={styles.thumbWrap}>
        <Image source={{ uri: episode.thumbnailUrl }} style={styles.thumb} />
        {episode.isLive ? (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        ) : null}
        {!PREMIUM_ON_HOLD && episode.isPremium ? (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        ) : null}
        {!VIDEO_STATUS_GATE_ON_HOLD && !episode.canPlay ? (
          <View style={styles.processingBadge}>
            <Text style={styles.processingText}>
              {episode.contentStatus === 'processing' ||
              episode.contentStatus === 'draft'
                ? 'PROCESSING'
                : 'NOT READY'}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.title, isTV && styles.tvTitle]} numberOfLines={2}>
        {episode.title}
      </Text>
      <Text style={styles.meta}>
        {episode.isLive
          ? 'LIVE'
          : episode.durationMinutes > 0
            ? `${episode.durationMinutes} min`
            : 'VOD'}{' '}
        · {episode.category}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: 14,
    borderWidth: 3,
    borderColor: 'transparent',
    padding: 2,
  },
  thumbWrap: {
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  thumb: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.spotlight,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveText: {
    color: colors.text,
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11,
    letterSpacing: 1,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: colors.overlay,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.accentDim,
  },
  premiumText: {
    color: colors.accent,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  processingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: colors.overlay,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  processingText: {
    color: colors.textMuted,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  title: {
    marginTop: 8,
    color: colors.text,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    lineHeight: 18,
  },
  tvTitle: {
    fontSize: tvScale(14, 18),
    lineHeight: tvScale(18, 24),
  },
  meta: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
  },
  pressed: {
    opacity: 0.9,
  },
  focused: {
    borderColor: colors.accent,
    transform: [{ scale: 1.05 }],
  },
});
