'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { API_BASE_URL, STORAGE_KEY, WOO_CHECKOUT_URL } from '@/lib/config';

type Props = {
  initialEmail?: string;
};

async function registerOrLogin(input: {
  name: string;
  email: string;
  password: string;
}): Promise<void> {
  if (!API_BASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_API_URL for auth.');
  }

  const registerRes = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      displayName: input.name,
    }),
  });

  if (registerRes.ok || registerRes.status === 201) {
    return;
  }

  // Account may already exist — try login so checkout can continue.
  if (registerRes.status === 409 || registerRes.status === 400) {
    const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
      }),
    });
    if (loginRes.ok || loginRes.status === 201) {
      return;
    }
    const loginBody = await loginRes.json().catch(() => null);
    throw new Error(
      messageFromBody(loginBody) ||
        'Could not sign in with that email/password.',
    );
  }

  const body = await registerRes.json().catch(() => null);
  throw new Error(
    messageFromBody(body) || `Register failed (${registerRes.status}).`,
  );
}

function messageFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const data = body as { message?: string | string[]; error?: string };
  if (Array.isArray(data.message)) {
    return data.message.filter(Boolean).join(' ') || null;
  }
  if (typeof data.message === 'string') {
    return data.message;
  }
  if (typeof data.error === 'string') {
    return data.error;
  }
  return null;
}

export function SubscribeForm({ initialEmail = '' }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const checkoutPreview = useMemo(() => {
    try {
      const u = new URL(WOO_CHECKOUT_URL);
      return `${u.origin}${u.pathname}`;
    } catch {
      return 'official checkout';
    }
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setError('Enter your name.');
      return;
    }
    if (!trimmedEmail.includes('@')) {
      setError('Enter a valid email.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setSubmitting(true);

    const ref =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `ref_${Date.now()}`;

    try {
      await registerOrLogin({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ref,
            name: trimmedName,
            email: trimmedEmail,
            createdAt: new Date().toISOString(),
          }),
        );
      } catch {
        // Private mode / blocked storage — still continue to checkout.
      }

      const target = new URL(WOO_CHECKOUT_URL);
      target.searchParams.set('ref', ref);
      target.searchParams.set('sl_email', trimmedEmail);
      window.location.assign(target.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Name</span>
        <input
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-12 rounded-sm border border-border bg-background/80 px-3 text-foreground outline-none transition ring-accent focus:ring-2"
          required
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-12 rounded-sm border border-border bg-background/80 px-3 text-foreground outline-none transition ring-accent focus:ring-2"
          required
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-12 rounded-sm border border-border bg-background/80 px-3 text-foreground outline-none transition ring-accent focus:ring-2"
          required
          minLength={4}
        />
      </label>

      {error ? (
        <p className="text-sm text-[#ff8a8a]" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 min-h-12 bg-accent px-5 font-semibold tracking-wide text-[#14110a] transition enabled:hover:brightness-105 enabled:active:scale-[0.99] disabled:opacity-60"
      >
        {submitting ? 'Creating account…' : 'Continue to payment'}
      </button>

      <p className="text-sm leading-relaxed text-muted">
        Next step opens the official checkout at{' '}
        <span className="text-foreground/80">{checkoutPreview}</span>. Card
        details are never entered on this page.
      </p>
    </form>
  );
}
