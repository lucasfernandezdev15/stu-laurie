import { Alert, Linking, Platform } from 'react-native';
import { SUBSCRIBE_WEB_URL } from '../config/billing';

/**
 * Opens the external subscribe/register page (Next → Woo checkout).
 * Billing stays on web to avoid store commissions / IAP.
 */
export async function openSubscribeWeb(email?: string | null): Promise<void> {
  const params: string[] = [];
  if (email?.trim()) {
    params.push(`email=${encodeURIComponent(email.trim().toLowerCase())}`);
  }
  if (Platform.OS !== 'web') {
    params.push('from=app');
  }

  const sep = SUBSCRIBE_WEB_URL.includes('?') ? '&' : '?';
  const href =
    params.length > 0
      ? `${SUBSCRIBE_WEB_URL}${sep}${params.join('&')}`
      : SUBSCRIBE_WEB_URL;

  try {
    const canOpen = await Linking.canOpenURL(href);
    if (!canOpen) {
      Alert.alert('Unable to open', 'Could not open the subscription page.');
      return;
    }
    await Linking.openURL(href);
  } catch {
    Alert.alert('Unable to open', 'Could not open the subscription page.');
  }
}
