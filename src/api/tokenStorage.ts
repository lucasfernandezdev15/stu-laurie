import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthTokens } from './types';

const TOKENS_KEY = '@stu_laurie/tokens_v1';

export async function loadTokens(): Promise<AuthTokens | null> {
  try {
    const raw = await AsyncStorage.getItem(TOKENS_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<AuthTokens>;
    if (
      typeof parsed.accessToken === 'string' &&
      typeof parsed.refreshToken === 'string' &&
      parsed.accessToken &&
      parsed.refreshToken
    ) {
      return {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(TOKENS_KEY);
}
