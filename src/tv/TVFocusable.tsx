import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { isTV, tvSpacing } from './platform';

export type TVFocusableState = {
  pressed: boolean;
  focused: boolean;
};

interface TVFocusableProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode | ((state: TVFocusableState) => ReactNode);
  style?:
    | StyleProp<ViewStyle>
    | ((state: TVFocusableState) => StyleProp<ViewStyle>);
  /** Prefer initial focus when entering the screen (TV). */
  preferredFocus?: boolean;
}

/**
 * Pressable with visible D-Pad focus ring on TV.
 * On phone/web behaves like a normal pressable (web also gets hover/focus cues).
 */
export function TVFocusable({
  children,
  style,
  preferredFocus = false,
  ...rest
}: TVFocusableProps) {
  return (
    <Pressable
      {...rest}
      hasTVPreferredFocus={isTV ? preferredFocus : undefined}
      style={(state) => {
        const focused = Boolean(
          (state as { focused?: boolean }).focused ?? false,
        );
        const pressed = Boolean(state.pressed);
        const resolved =
          typeof style === 'function'
            ? style({ pressed, focused })
            : style;

        return [
          styles.base,
          focused && styles.focused,
          pressed && styles.pressed,
          resolved,
        ];
      }}
    >
      {(state) => {
        const focused = Boolean(
          (state as { focused?: boolean }).focused ?? false,
        );
        const pressed = Boolean(state.pressed);
        return typeof children === 'function'
          ? children({ pressed, focused })
          : children;
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: tvSpacing.focusRing,
    borderColor: 'transparent',
  },
  focused: {
    borderColor: colors.accent,
    backgroundColor: isTV ? 'rgba(240, 199, 94, 0.08)' : undefined,
    transform: isTV ? [{ scale: 1.04 }] : undefined,
  },
  pressed: {
    opacity: 0.9,
  },
});
