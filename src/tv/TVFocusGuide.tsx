import { type ComponentType, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { isTV } from './platform';

type GuideProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
  trapFocusUp?: boolean;
  trapFocusDown?: boolean;
  trapFocusLeft?: boolean;
  trapFocusRight?: boolean;
};

interface TVFocusGuideProps extends GuideProps {
  children: ReactNode;
}

/**
 * Wraps react-native-tvos TVFocusGuideView when available.
 * Falls back to View on web/phone so the same tree compiles everywhere.
 */
export function TVFocusGuide({
  children,
  style,
  autoFocus = true,
  trapFocusUp,
  trapFocusDown,
  trapFocusLeft,
  trapFocusRight,
}: TVFocusGuideProps) {
  const NativeGuide = (
    require('react-native') as { TVFocusGuideView?: ComponentType<GuideProps> }
  ).TVFocusGuideView;

  if (!isTV || !NativeGuide) {
    return <View style={style}>{children}</View>;
  }

  return (
    <NativeGuide
      style={style}
      autoFocus={autoFocus}
      trapFocusUp={trapFocusUp}
      trapFocusDown={trapFocusDown}
      trapFocusLeft={trapFocusLeft}
      trapFocusRight={trapFocusRight}
    >
      {children}
    </NativeGuide>
  );
}
