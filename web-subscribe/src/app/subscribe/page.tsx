import { SubscribeForm } from '@/components/SubscribeForm';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawEmail = params.email;
  const initialEmail = Array.isArray(rawEmail) ? rawEmail[0] ?? '' : rawEmail ?? '';

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 15% 10%, rgba(226,61,74,0.22), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 20%, rgba(240,199,94,0.14), transparent 50%), linear-gradient(180deg, #12141a 0%, #090a0d 55%, #090a0d 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent, transparent 47px, rgba(245,241,232,0.03) 48px)',
        }}
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center px-6 py-14 sm:px-10 lg:px-14 lg:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          <header className="max-w-xl animate-[fade-up_0.7s_ease-out_both] lg:pt-6">
            <p className="font-[family-name:var(--font-bebas)] text-2xl tracking-[0.22em] text-accent md:text-3xl lg:text-4xl">
              STU &amp; LAURIE
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-bebas)] text-5xl leading-[0.95] tracking-wide text-foreground sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              Join the variety hour
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted md:text-lg">
              Create your profile here, then finish the Monthly membership
              ($11.50) on the official WordPress checkout.
            </p>
          </header>

          <section
            aria-label="Create membership profile"
            className="w-full max-w-md justify-self-start animate-[fade-up_0.7s_ease-out_0.12s_both] lg:max-w-lg lg:justify-self-end"
          >
            <div className="border border-border/80 bg-surface/70 p-6 backdrop-blur-sm sm:p-8 lg:p-9">
              <p className="font-[family-name:var(--font-bebas)] text-xl tracking-[0.12em] text-foreground">
                Create your profile
              </p>
              <p className="mt-1 text-sm text-muted">
                Payment happens next, on the official checkout.
              </p>
              <SubscribeForm initialEmail={initialEmail} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
