import { ScrollView, StyleSheet, Text, View } from 'react-native';
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

export function ContentRow({
  title,
  episodes,
  onSelect,
  preferredFocusFirst = false,
}: ContentRowProps) {
  const isDesktop = useIsDesktopWeb();

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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={isDesktop}
          contentContainerStyle={[styles.row, { paddingHorizontal: pad }]}
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
  row: {
    paddingBottom: 4,
  },
});
