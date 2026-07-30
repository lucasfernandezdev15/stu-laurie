import { apiRequest, extractTokens, setSessionTokens } from './client';
import type {
  AuthTokens,
  AuthUser,
  LoginDto,
  RegisterDto,
} from './types';

export async function registerUser(
  dto: RegisterDto,
): Promise<{ tokens: AuthTokens; user?: AuthUser }> {
  const data = await apiRequest<unknown>('/api/auth/register', {
    method: 'POST',
    body: dto,
    auth: false,
  });
  try {
    const tokens = extractTokens(data);
    await setSessionTokens(tokens);
    return { tokens, user: pickUser(data) };
  } catch {
    // Some backends create the user on register and only mint tokens on login.
    return loginUser({ email: dto.email, password: dto.password });
  }
}

export async function loginUser(
  dto: LoginDto,
): Promise<{ tokens: AuthTokens; user?: AuthUser }> {
  const data = await apiRequest<unknown>('/api/auth/login', {
    method: 'POST',
    body: dto,
    auth: false,
  });
  const tokens = extractTokens(data);
  await setSessionTokens(tokens);
  return { tokens, user: pickUser(data) };
}

export async function fetchMe(): Promise<AuthUser> {
  const data = await apiRequest<unknown>('/api/auth/me', { method: 'GET' });
  const user = pickUser(data) ?? (data as AuthUser);
  if (!user?.id && !user?.email) {
    throw new Error('Respuesta /api/auth/me inválida.');
  }
  return user;
}

function pickUser(data: unknown): AuthUser | undefined {
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const root = data as Record<string, unknown>;
  if (root.user && typeof root.user === 'object') {
    return root.user as AuthUser;
  }
  if (typeof root.email === 'string' || typeof root.id === 'string') {
    return root as unknown as AuthUser;
  }
  return undefined;
}
