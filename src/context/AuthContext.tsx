import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  email: string;
  name: string;
}

interface PersistedSession {
  user: User;
  hasActiveSubscription: boolean;
  planId: string | null;
}

interface AuthContextValue {
  user: User | null;
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
  activateSubscription: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const STORAGE_KEY = '@stu_laurie/session_v1';
const DEMO_HINT =
  'Usá un email válido y una contraseña de al menos 4 caracteres.';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const persist = useCallback(async (session: PersistedSession | null) => {
    if (!session) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && mounted) {
          const session = JSON.parse(raw) as PersistedSession;
          setUser(session.user);
          setHasActiveSubscription(Boolean(session.hasActiveSubscription));
          setPlanId(session.planId ?? null);
        }
      } catch {
        // ignore corrupt storage
      } finally {
        if (mounted) {
          setIsHydrating(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const normalized = email.trim().toLowerCase();
      if (!normalized.includes('@') || password.length < 4) {
        return DEMO_HINT;
      }
      await delay(350);
      const nextUser: User = {
        email: normalized,
        name: displayNameFromEmail(normalized),
      };
      setUser(nextUser);
      await persist({
        user: nextUser,
        hasActiveSubscription,
        planId,
      });
      return null;
    },
    [hasActiveSubscription, persist, planId],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      if (name.trim().length < 2) {
        return 'Ingresá un nombre válido.';
      }
      const normalized = email.trim().toLowerCase();
      if (!normalized.includes('@') || password.length < 4) {
        return DEMO_HINT;
      }
      await delay(350);
      const nextUser: User = {
        email: normalized,
        name: name.trim(),
      };
      setUser(nextUser);
      setHasActiveSubscription(false);
      setPlanId(null);
      await persist({
        user: nextUser,
        hasActiveSubscription: false,
        planId: null,
      });
      return null;
    },
    [persist],
  );

  const logout = useCallback(async () => {
    setUser(null);
    setHasActiveSubscription(false);
    setPlanId(null);
    await persist(null);
  }, [persist]);

  const activateSubscription = useCallback(
    async (nextPlanId: string) => {
      setHasActiveSubscription(true);
      setPlanId(nextPlanId);
      if (user) {
        await persist({
          user,
          hasActiveSubscription: true,
          planId: nextPlanId,
        });
      }
    },
    [persist, user],
  );

  const cancelSubscription = useCallback(async () => {
    setHasActiveSubscription(false);
    setPlanId(null);
    if (user) {
      await persist({
        user,
        hasActiveSubscription: false,
        planId: null,
      });
    }
  }, [persist, user]);

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
      activateSubscription,
      cancelSubscription,
    }),
    [
      user,
      hasActiveSubscription,
      planId,
      isHydrating,
      login,
      register,
      logout,
      activateSubscription,
      cancelSubscription,
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

function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'Fan';
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
