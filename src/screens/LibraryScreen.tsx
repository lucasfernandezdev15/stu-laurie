import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../components/AppButton';
import { ContentCard } from '../components/ContentCard';
import { Screen } from '../components/Screen';
import type { Episode } from '../data/catalog';
import { useCatalog } from '../context/CatalogContext';
import { desktopSpacing, useIsDesktopWeb } from '../layout/desktop';
import { colors } from '../theme/colors';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Library'>,
  NativeStackScreenProps<RootStackParamList>
>;

const CARD_GAP = 12;

export function LibraryScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = useIsDesktopWeb();
  const { episodes, isLoading, error, refresh } = useCatalog();
  const hPad = isDesktop ? desktopSpacing.screenPad : 20;
  const columns =
    width >= 1600
      ? 6
      : width >= 1280
        ? 5
        : width >= 1100
          ? 4
          : width >= 900
            ? 3
            : 2;
  const cardWidth = (width - hPad * 2 - CARD_GAP * (columns - 1)) / columns;

  const onSelect = (episode: Episode) => {
    navigation.navigate('ContentDetail', {
      episodeId: episode.id,
      kind: episode.kind,
    });
  };

  return (
    <Screen>
      <StatusBar style="light" />
      <Text style={[styles.title, { paddingHorizontal: hPad }]}>Library</Text>
      <Text style={[styles.subtitle, { paddingHorizontal: hPad }]}>
        Full catalog · VOD & live
      </Text>
      {isLoading && episodes.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : error && episodes.length === 0 ? (
        <View style={[styles.center, { paddingHorizontal: hPad }]}>
          <Text style={styles.error}>{error}</Text>
          <AppButton label="Retry" onPress={() => void refresh()} />
        </View>
      ) : (
        <FlatList
          key={`cols-${columns}`}
          data={episodes}
          keyExtractor={(item) => `${item.kind}:${item.id}`}
          numColumns={columns}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.list, { paddingHorizontal: hPad }]}
          ListEmptyComponent={
            <Text style={styles.empty}>No videos published yet.</Text>
          }
          renderItem={({ item }) => (
            <ContentCard
              episode={item}
              onPress={onSelect}
              width={cardWidth}
              style={styles.card}
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 40,
    color: colors.text,
  },
  subtitle: {
    marginBottom: 16,
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
  },
  list: {
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    marginRight: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 40,
  },
  error: {
    color: colors.spotlight,
    fontFamily: 'SourceSans3_400Regular',
    textAlign: 'center',
  },
  empty: {
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    marginTop: 24,
  },
});
