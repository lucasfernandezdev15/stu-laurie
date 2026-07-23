import { type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { desktopSpacing } from '../layout/desktop';
import { colors } from '../theme/colors';

interface ScreenProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
  /** Center content on large web viewports */
  constrainWeb?: boolean;
}

export function Screen({
  children,
  style,
  edges = ['top', 'left', 'right'],
  constrainWeb = true,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={styles.safe}>
      <View
        style={[
          styles.inner,
          constrainWeb && Platform.OS === 'web' && styles.webConstrained,
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  webConstrained: {
    maxWidth: desktopSpacing.contentMaxWidth,
  },
});
