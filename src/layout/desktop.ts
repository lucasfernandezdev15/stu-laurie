import { Platform, useWindowDimensions } from 'react-native';
import { isTV } from '../tv/platform';

/** Min width where the web app switches to desktop chrome. */
export const DESKTOP_BREAKPOINT = 960;

export const desktopSpacing = {
  /** Soft cap for dense text columns only — main chrome uses full viewport width. */
  contentMaxWidth: 1920,
  screenPad: 40,
  headerHeight: 64,
  cardWidth: 220,
  heroMinHeight: 520,
} as const;

export function isWebPlatform(): boolean {
  return Platform.OS === 'web';
}

/** Desktop web layout (not TV preview). */
export function useIsDesktopWeb(): boolean {
  const { width } = useWindowDimensions();
  return isWebPlatform() && !isTV && width >= DESKTOP_BREAKPOINT;
}
