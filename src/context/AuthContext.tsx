import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchMe, loginUser, registerUser } from '../api/auth';
import {
  clearSessionTokens,
  hydrateTokenMemory,
  setAuthFailureHandler,
} from '../api/client';
import { displayNameFromUser, subscriptionFromUser } from '../api/entitlement';
import { ApiError } from '../api/errors';
import type { AuthUser } from '../api/types';

export interface AppUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AppUser | null;
  hasActiveSubscription: boolean;
  planId: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAppUser(authUser: AuthUser): AppUser {
  return {
    id: authUser.id || authUser.email,
    email: authUser.email,
    name: displayNameFromUser(authUser),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const applyAuthUser = useCallback((authUser: AuthUser) => {
    setUser(toAppUser(authUser));
    const sub = subscriptionFromUser(authUser);
    setHasActiveSubscription(sub.hasActiveSubscription);
    setPlanId(sub.planId);
  }, []);

  const clearLocalSession = useCallback(async () => {
    setUser(null);
    setHasActiveSubscription(false);
    setPlanId(null);
    await clearSessionTokens();
  }, []);

  const refreshSession = useCallback(async () => {
    const me = await fetchMe();
    applyAuthUser(me);
  }, [applyAuthUser]);

  useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null);
      setHasActiveSubscription(false);
      setPlanId(null);
    });
    return () => setAuthFailureHandler(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tokens = await hydrateTokenMemory();
        if (!tokens) {
          return;
        }
        const me = await fetchMe();
        if (mounted) {
          applyAuthUser(me);
        }
      } catch {
        await clearSessionTokens();
        if (mounted) {
          setUser(null);
          setHasActiveSubscription(false);
          setPlanId(null);
        }
      } finally {
        if (mounted) {
          setIsHydrating(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [applyAuthUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const normalized = email.trim().toLowerCase();
      if (!normalized.includes('@') || password.length < 4) {
        return 'Usá un email válido y una contraseña de al menos 4 caracteres.';
      }
      try {
        const { user: authUser } = await loginUser({
          email: normalized,
          password,
        });
        if (authUser) {
          applyAuthUser(authUser);
        }
        await refreshSession();
        return null;
      } catch (err) {
        return err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'No se pudo iniciar sesión.';
      }
    },
    [applyAuthUser, refreshSession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      if (name.trim().length < 2) {
        return 'Ingresá un nombre válido.';
      }
      const normalized = email.trim().toLowerCase();
      if (!normalized.includes('@') || password.length < 4) {
        return 'Usá un email válido y una contraseña de al menos 4 caracteres.';
      }
      try {
        const { user: authUser } = await registerUser({
          email: normalized,
          password,
          displayName: name.trim(),
        });
        if (authUser) {
          applyAuthUser(authUser);
        }
        await refreshSession();
        return null;
      } catch (err) {
        return err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'No se pudo crear la cuenta.';
      }
    },
    [applyAuthUser, refreshSession],
  );

  const logout = useCallback(async () => {
    await clearLocalSession();
  }, [clearLocalSession]);

  const value = useMemo(
    () => ({
      user,
      hasActiveSubscription,
      planId,
      isAuthenticated: user !== null,
      isHydrating,
      login,
      register,
      logout,
      refreshSession,
    }),
    [
      user,
      hasActiveSubscription,
      planId,
      isHydrating,
      login,
      register,
      logout,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
