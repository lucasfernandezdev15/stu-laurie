'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { STORAGE_KEY, WOO_CHECKOUT_URL } from '@/lib/config';

type Props = {
  initialEmail?: string;
};

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

  function onSubmit(event: FormEvent<HTMLFormElement>) {
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

    // MVP: local pending profile until a real backend exists.
    // WordPress still needs a small hook to persist `ref` on the order.
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
    // Hint for future WP prefill; ignored by stock Woo unless customised.
    target.searchParams.set('sl_email', trimmedEmail);

    window.location.assign(target.toString());
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
        {submitting ? 'Redirecting…' : 'Continue to payment'}
      </button>

      <p className="text-sm leading-relaxed text-muted">
        Next step opens the official checkout at{' '}
        <span className="text-foreground/80">{checkoutPreview}</span>. Card
        details are never entered on this page.
      </p>
    </form>
  );
}
