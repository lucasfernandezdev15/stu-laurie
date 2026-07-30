import { assertApiConfigured, apiUrl } from './config';
import { ApiError, messageFromApiBody } from './errors';
import {
  clearTokens,
  loadTokens,
  saveTokens,
} from './tokenStorage';
import type { AuthTokens, RefreshTokenDto } from './types';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
  /** Skip refresh retry (used by refresh itself). */
  skipRefresh?: boolean;
  signal?: AbortSignal;
};

let memoryTokens: AuthTokens | null = null;
let refreshInFlight: Promise<AuthTokens | null> | null = null;
let onAuthFailure: (() => void) | null = null;

export function setAuthFailureHandler(handler: (() => void) | null): void {
  onAuthFailure = handler;
}

export async function hydrateTokenMemory(): Promise<AuthTokens | null> {
  memoryTokens = await loadTokens();
  return memoryTokens;
}

export function getMemoryTokens(): AuthTokens | null {
  return memoryTokens;
}

export async function setSessionTokens(tokens: AuthTokens): Promise<void> {
  memoryTokens = tokens;
  await saveTokens(tokens);
}

export async function clearSessionTokens(): Promise<void> {
  memoryTokens = null;
  await clearTokens();
}

function pickTokens(data: unknown): AuthTokens | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const root = data as Record<string, unknown>;
  const nested =
    root.tokens && typeof root.tokens === 'object'
      ? (root.tokens as Record<string, unknown>)
      : null;
  const accessToken =
    (typeof root.accessToken === 'string' && root.accessToken) ||
    (typeof root.access_token === 'string' && root.access_token) ||
    (nested &&
      typeof nested.accessToken === 'string' &&
      nested.accessToken) ||
    (nested &&
      typeof nested.access_token === 'string' &&
      nested.access_token) ||
    null;
  const refreshToken =
    (typeof root.refreshToken === 'string' && root.refreshToken) ||
    (typeof root.refresh_token === 'string' && root.refresh_token) ||
    (nested &&
      typeof nested.refreshToken === 'string' &&
      nested.refreshToken) ||
    (nested &&
      typeof nested.refresh_token === 'string' &&
      nested.refresh_token) ||
    null;
  if (!accessToken || !refreshToken) {
    return null;
  }
  return { accessToken, refreshToken };
}

export function extractTokens(data: unknown): AuthTokens {
  const tokens = pickTokens(data);
  if (!tokens) {
    throw new ApiError(
      500,
      'La respuesta de auth no incluye accessToken/refreshToken.',
      data,
    );
  }
  return tokens;
}

async function refreshAccessToken(): Promise<AuthTokens | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const current = memoryTokens ?? (await loadTokens());
    if (!current?.refreshToken) {
      return null;
    }
    try {
      assertApiConfigured();
      const payload: RefreshTokenDto = { refreshToken: current.refreshToken };
      const response = await fetch(apiUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      const data = text ? safeJson(text) : null;
      if (!response.ok) {
        await clearSessionTokens();
        onAuthFailure?.();
        return null;
      }
      const next = extractTokens(data);
      await setSessionTokens(next);
      return next;
    } catch {
      await clearSessionTokens();
      onAuthFailure?.();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  assertApiConfigured();

  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const useAuth = options.auth !== false;
  if (useAuth) {
    if (!memoryTokens) {
      memoryTokens = await loadTokens();
    }
    if (memoryTokens?.accessToken) {
      headers.Authorization = `Bearer ${memoryTokens.accessToken}`;
    }
  }

  const url = apiUrl(path);
  const response = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (
    response.status === 401 &&
    useAuth &&
    !options.skipRefresh &&
    memoryTokens?.refreshToken
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
  }

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      messageFromApiBody(
        data,
        `Error ${response.status} en ${method} ${path}`,
      ),
      data,
    );
  }

  return data as T;
}
