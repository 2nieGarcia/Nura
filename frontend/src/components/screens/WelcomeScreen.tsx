import { APP_COPY } from "../../constants/app";

/**
 * WelcomeScreen — replaces the centered hero with a "Health Desk" intake.
 *
 * Composition:
 *   1. Letterhead is rendered by AppShell (header) — present on welcome too,
 *      so the brand register is consistent from the first moment.
 *   2. The question is the hero. It uses Fraunces display weight so users
 *      pattern-match it as a public form, not an AI assistant prompt.
 *   3. Disclaimer is raised to 14px (text-meta) and given a left ink-rule.
 *      This is the most important sentence in the app and now it reads like
 *      it.
 *   4. Single primary CTA pinned near the thumb zone.
 */
type WelcomeScreenProps = {
  onStart: () => void;
};

export function WelcomeScreen({ onStart }: WelcomeScreenProps): JSX.Element {
  return (
    <section className="paper-in flex flex-1 flex-col px-5 pb-6 pt-6">
      {/* Question hero */}
      <div className="flex-1">
        <p className="font-mono text-label uppercase text-seal">
          Magsimula
        </p>
        <h2 className="mt-2 font-display text-display text-ink">
          Ano ang nararamdaman mo ngayon?
        </h2>
        <p className="mt-4 max-w-[28ch] text-body-lg text-ink-soft">
          {APP_COPY.tagline}
        </p>

        {/* Disclaimer-as-rule (not a card). 14px, never below. */}
        <div className="mt-8 border-l-rule border-ink/30 pl-3">
          <p className="text-meta text-ink">
            Hindi ito medical advice at hindi kami doktor. Tutulong lang kami
            saan ka pwedeng magpatingin, anong benefit ang pwede mong gamitin,
            at ano ang sasabihin mo sa front desk.
          </p>
          <p className="mt-2 text-meta text-ink-mute">
            {APP_COPY.privacyNote}
          </p>
        </div>
      </div>

      {/* Primary CTA — anchored near the thumb. */}
      <button
        type="button"
        onClick={onStart}
        className="mt-8 inline-flex min-h-[56px] w-full items-center justify-center rounded-form bg-seal px-6 text-body-lg font-semibold text-card transition-colors hover:bg-seal-press"
      >
        Magsimula
      </button>
    </section>
  );
}
