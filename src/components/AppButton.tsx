import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { isTV, tvScale } from '../tv/platform';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface AppButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  preferredFocus?: boolean;
}

export function AppButton({
  label,
  variant = 'primary',
  style,
  labelStyle,
  disabled,
  preferredFocus = false,
  ...rest
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hasTVPreferredFocus={isTV ? preferredFocus : undefined}
      style={(state) => {
        const focused = Boolean(
          (state as { focused?: boolean }).focused,
        );
        return [
          styles.base,
          styles[variant],
          isTV && styles.tvBase,
          state.pressed && styles.pressed,
          focused && styles.focused,
          disabled && styles.disabled,
          style,
        ];
      }}
      {...rest}
    >
      <Text
        style={[
          styles.label,
          styles[`${variant}Label`],
          isTV && styles.tvLabel,
          labelStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  tvBase: {
    minHeight: tvScale(48, 64),
    paddingHorizontal: 28,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
  },
  focused: {
    borderColor: colors.accent,
    transform: [{ scale: 1.03 }],
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  tvLabel: {
    fontSize: 20,
  },
  primaryLabel: {
    color: '#14110A',
  },
  secondaryLabel: {
    color: colors.text,
  },
  ghostLabel: {
    color: colors.accent,
  },
});
