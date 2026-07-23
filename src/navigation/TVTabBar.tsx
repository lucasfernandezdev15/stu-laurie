import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TVFocusable, TVFocusGuide, tvSpacing } from '../tv';
import { colors } from '../theme/colors';

/** Side rail tab bar for Apple TV / Android TV D-Pad navigation. */
export function TVTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <TVFocusGuide style={styles.rail} trapFocusLeft autoFocus>
      <Text style={styles.brand}>STU & LAURIE</Text>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title ?? route.name;
        const isFocused = state.index === index;

        return (
          <TVFocusable
            key={route.key}
            preferredFocus={index === 0}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={(focusState) => [
              styles.item,
              isFocused && styles.itemActive,
              focusState.focused && styles.itemFocused,
            ]}
          >
            <Text
              style={[styles.itemLabel, isFocused && styles.itemLabelActive]}
            >
              {label}
            </Text>
          </TVFocusable>
        );
      })}
      <View style={styles.spacer} />
      <Text style={styles.hint}>D-Pad · OK to select · Back to exit</Text>
    </TVFocusGuide>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: tvSpacing.railWidth,
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 28,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
    zIndex: 10,
  },
  brand: {
    color: colors.accent,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    letterSpacing: 2,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  item: {
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  itemActive: {
    backgroundColor: colors.surfaceElevated,
  },
  itemFocused: {
    backgroundColor: 'rgba(240, 199, 94, 0.14)',
  },
  itemLabel: {
    color: colors.textMuted,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 20,
  },
  itemLabelActive: {
    color: colors.text,
  },
  spacer: {
    flex: 1,
  },
  hint: {
    color: colors.textMuted,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
