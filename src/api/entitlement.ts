import type { AuthUser } from './types';

export function displayNameFromUser(user: AuthUser | null | undefined): string {
  if (!user) {
    return 'Fan';
  }
  const fromProfile = user.profile?.displayName?.trim();
  if (fromProfile) {
    return fromProfile;
  }
  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }
  const local = user.email?.split('@')[0] ?? 'Fan';
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function subscriptionFromUser(user: AuthUser | null | undefined): {
  hasActiveSubscription: boolean;
  planId: string | null;
} {
  if (!user) {
    return { hasActiveSubscription: false, planId: null };
  }

  const planId =
    user.planId ??
    user.subscription?.planId ??
    user.billing?.planId ??
    null;

  if (typeof user.hasActiveSubscription === 'boolean') {
    return { hasActiveSubscription: user.hasActiveSubscription, planId };
  }
  if (user.subscription?.active === true) {
    return { hasActiveSubscription: true, planId };
  }
  if (user.entitlements?.streaming === true) {
    return { hasActiveSubscription: true, planId };
  }

  const status = (
    user.subscription?.status ??
    user.billing?.subscriptionStatus ??
    ''
  )
    .toString()
    .toLowerCase();

  const activeStatuses = new Set([
    'active',
    'trialing',
    'paid',
    'subscriber',
    'premium',
  ]);

  return {
    hasActiveSubscription: activeStatuses.has(status),
    planId,
  };
}
