import { Platform } from 'react-native';

/**
 * Full backend origin for native apps (no CORS).
 * Example: https://streaming-backend-vlfm.onrender.com
 */
export const BACKEND_ORIGIN =
  process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '') || '';

/**
 * Web uses same-origin `/api/*` (Metro dev proxy + Vercel rewrite) to avoid CORS.
 * Native uses BACKEND_ORIGIN directly.
 */
export const API_BASE_URL = Platform.OS === 'web' ? '' : BACKEND_ORIGIN;

export function apiUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

export function assertApiConfigured(): void {
  if (Platform.OS === 'web') {
    return;
  }
  if (!BACKEND_ORIGIN) {
    throw new Error(
      'Falta EXPO_PUBLIC_API_URL en .env (URL base del backend).',
    );
  }
}
