import { Platform } from 'react-native';

/**
 * True on Apple TV / Android TV (react-native-tvos).
 * Set EXPO_PUBLIC_FORCE_TV=1 to preview TV chrome on web/mobile.
 */
export const isTV: boolean =
  process.env.EXPO_PUBLIC_FORCE_TV === '1' ||
  Boolean((Platform as { isTV?: boolean }).isTV);

/** Larger targets and type for the 10-foot UI. */
export function tvScale(mobile: number, tv: number = mobile * 1.35): number {
  return isTV ? tv : mobile;
}

export const tvSpacing = {
  screenPad: tvScale(20, 48),
  railWidth: 240,
  cardWidth: tvScale(168, 280),
  focusRing: 3,
} as const;
