import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { desktopSpacing } from '../layout/desktop';

/** Top navigation bar for desktop web. */
export function DesktopTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.inner}>
        <Text style={styles.brand}>STU & LAURIE</Text>
        <View style={styles.tabs}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : options.title ?? route.name;
            const isFocused = state.index === index;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
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
                style={({ pressed, hovered }) => [
                  styles.tab,
                  isFocused && styles.tabActive,
                  (Boolean(hovered) || pressed) && styles.tabHover,
                ]}
              >
                <Text
                  style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: desktopSpacing.headerHeight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  inner: {
    flex: 1,
    maxWidth: desktopSpacing.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: desktopSpacing.screenPad,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: colors.accent,
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 26,
    letterSpacing: 3,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  tabHover: {
    backgroundColor: colors.surfaceElevated,
  },
  tabLabel: {
    color: colors.textMuted,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.4,
  },
  tabLabelActive: {
    color: colors.text,
  },
});
