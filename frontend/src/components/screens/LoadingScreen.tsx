/**
 * LoadingScreen — narrate, don't decorate.
 *
 * Was: 3 pulsing dots + two skeleton cards. That's "Generic Loading State
 * #47" — it teaches the user nothing about why the wait is worth it.
 *
 * Now: one sentence that names what's happening, plus a 3px indeterminate
 * progress bar. The wait becomes evidence of work, not filler.
 *
 * Note: the actual concern/location aren't passed in here (state hook
 * doesn't expose them to this component) so the message is intentionally
 * generic-but-specific. If desired, a future refactor can thread them
 * through to substitute "sa Quezon City" inline.
 */
export function LoadingScreen(): JSX.Element {
  return (
    <section
      className="paper-in flex flex-1 flex-col px-5 pb-6 pt-10"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="font-mono text-label uppercase text-seal">
        Hinahanap...
      </p>
      <h2 className="mt-2 font-display text-[1.5rem] leading-snug text-ink">
        Tinitingnan ang mga health center na tumatanggap ng iyong benefit.
      </h2>
      <p className="mt-3 text-body text-ink-soft">
        Sinasala ang PhilHealth, YAKAP, Malasakit Center, at LGU primary care
        sa lugar mo. Ipapakita ko muna ang isa — yung pinakamalapit at
        pinaka-tapat sa concern mo.
      </p>

      <div className="mt-8" aria-hidden="true">
        <div className="progress-rail" />
      </div>

      {/* Honest expectation-setting. */}
      <p className="mt-6 text-meta text-ink-mute">
        Karaniwang 1–2 segundo lang ito.
      </p>
    </section>
  );
}
