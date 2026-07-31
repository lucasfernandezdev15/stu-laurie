import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type LayoutChangeEvent,
} from 'react-native';
import type { Episode } from '../data/catalog';
import { desktopSpacing, useIsDesktopWeb } from '../layout/desktop';
import { colors } from '../theme/colors';
import { TVFocusGuide, isTV, tvSpacing } from '../tv';
import { ContentCard } from './ContentCard';

interface ContentRowProps {
  title: string;
  episodes: Episode[];
  onSelect: (episode: Episode) => void;
  /** Give preferred focus to the first card in this row (TV). */
  preferredFocusFirst?: boolean;
}

const CARD_GAP = 14;
const SCROLLBAR_STYLE_ID = 'content-row-hide-scrollbar';

export function ContentRow({
  title,
  episodes,
  onSelect,
  preferredFocusFirst = false,
}: ContentRowProps) {
  const isDesktop = useIsDesktopWeb();
  const scrollRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }
    if (document.getElementById(SCROLLBAR_STYLE_ID)) {
      return;
    }
    const style = document.createElement('style');
    style.id = SCROLLBAR_STYLE_ID;
    style.textContent =
      '.content-row-scroll::-webkit-scrollbar{display:none;height:0}' +
      '.content-row-scroll{scrollbar-width:none;-ms-overflow-style:none}';
    document.head.appendChild(style);
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrollX(event.nativeEvent.contentOffset.x);
    },
    [],
  );

  const onViewportLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportWidth(event.nativeEvent.layout.width);
  }, []);

  if (episodes.length === 0) {
    return null;
  }

  const pad = isTV
    ? tvSpacing.screenPad
    : isDesktop
      ? desktopSpacing.screenPad
      : 20;
  const cardWidth = isTV
    ? tvSpacing.cardWidth
    : isDesktop
      ? desktopSpacing.cardWidth
      : 168;

  const maxScroll = Math.max(0, contentWidth - viewportWidth);
  const canScrollLeft = isDesktop && scrollX > 4;
  const canScrollRight = isDesktop && scrollX < maxScroll - 4;
  const showArrows = isDesktop && maxScroll > 4;

  const scrollByPage = (direction: -1 | 1) => {
    const step = Math.max(
      cardWidth + CARD_GAP,
      Math.floor(viewportWidth * 0.85),
    );
    const next = Math.min(
      maxScroll,
      Math.max(0, scrollX + direction * step),
    );
    scrollRef.current?.scrollTo({ x: next, animated: true });
    setScrollX(next);
  };

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.heading,
          isTV && styles.tvHeading,
          isDesktop && styles.desktopHeading,
          { paddingHorizontal: pad },
        ]}
      >
        {title}
      </Text>
      <TVFocusGuide autoFocus={preferredFocusFirst}>
        <View style={styles.rowShell} onLayout={onViewportLayout}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onScroll}
            onContentSizeChange={(width) => setContentWidth(width)}
            contentContainerStyle={[styles.row, { paddingHorizontal: pad }]}
            {...(Platform.OS === 'web'
              ? ({ className: 'content-row-scroll' } as object)
              : null)}
          >
            {episodes.map((episode, index) => (
              <ContentCard
                key={episode.id}
                episode={episode}
                onPress={onSelect}
                width={cardWidth}
                preferredFocus={preferredFocusFirst && index === 0}
              />
            ))}
          </ScrollView>

          {showArrows && canScrollLeft ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Scroll ${title} left`}
              onPress={() => scrollByPage(-1)}
              style={({ pressed }) => [
                styles.arrow,
                styles.arrowLeft,
                pressed && styles.arrowPressed,
              ]}
            >
              <Text style={styles.arrowLabel}>‹</Text>
            </Pressable>
          ) : null}

          {showArrows && canScrollRight ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Scroll ${title} right`}
              onPress={() => scrollByPage(1)}
              style={({ pressed }) => [
                styles.arrow,
                styles.arrowRight,
                pressed && styles.arrowPressed,
              ]}
            >
              <Text style={styles.arrowLabel}>›</Text>
            </Pressable>
          ) : null}
        </View>
      </TVFocusGuide>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  heading: {
    color: colors.text,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    letterSpacing: 1,
    marginBottom: 12,
  },
  tvHeading: {
    fontSize: 36,
  },
  desktopHeading: {
    fontSize: 32,
    marginBottom: 16,
  },
  rowShell: {
    position: 'relative',
  },
  row: {
    paddingBottom: 4,
  },
  arrow: {
    position: 'absolute',
    top: 0,
    bottom: 28,
    width: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 10, 13, 0.72)',
    zIndex: 2,
  },
  arrowLeft: {
    left: 0,
  },
  arrowRight: {
    right: 0,
  },
  arrowPressed: {
    backgroundColor: 'rgba(9, 10, 13, 0.9)',
  },
  arrowLabel: {
    color: colors.text,
    fontSize: 42,
    lineHeight: 42,
    fontFamily: 'SourceSans3_700Bold',
    marginTop: -4,
  },
});
