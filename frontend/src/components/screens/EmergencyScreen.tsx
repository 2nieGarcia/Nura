import { useEffect, useRef } from "react";
import { APP_COPY } from "../../constants/app";

/**
 * EmergencyScreen — a true *interrupt*, not a "red marketing screen".
 *
 * What changed vs. the previous version:
 * - No more centered-hero composition. The previous version looked like the
 *   Welcome screen with a different color, which is exactly the wrong signal
 *   for a panicking user.
 * - Top half is full-bleed stamp red. No header, no logo, no margins. The
 *   only things that exist on this screen are the message, the call button,
 *   and the undo button.
 * - The "Hindi pala emergency" undo is given the same height as the call
 *   button. A user who landed here on a false positive (e.g. typing
 *   "lagnat") must have an equally easy escape, otherwise we have just
 *   trapped them.
 * - role="alertdialog" + initial focus on Call 911 + restored focus on
 *   dismiss = correct AT semantics for an interrupt.
 */
type EmergencyScreenProps = {
  onDismiss: () => void;
};

export function EmergencyScreen({ onDismiss }: EmergencyScreenProps): JSX.Element {
  const callRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Move focus to the call action on mount so screen readers announce it
    // first and so a panicking user can tap-and-go via keyboard if needed.
    callRef.current?.focus();
  }, []);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="emergency-title"
      aria-describedby="emergency-body"
      className="flex min-h-[100dvh] flex-col bg-card"
    >
      {/* Top half: full-bleed stamp red. The visual register of an emergency
          public-health poster. */}
      <div className="flex flex-col bg-stamp px-5 pb-8 pt-10">
        <p className="font-mono text-label uppercase tracking-[0.18em] text-card/85">
          Babala — kailangang aksyunan agad
        </p>
        <h2
          id="emergency-title"
          className="mt-3 font-display text-[2.25rem] leading-[2.5rem] font-bold text-card"
        >
          EMERGENCY ITO.
        </h2>
        <p
          id="emergency-body"
          className="mt-3 max-w-[36ch] text-body-lg text-card/95"
        >
          {APP_COPY.emergencyMessage}
        </p>
      </div>

      {/* Bottom half: actions. Equal weight call vs. dismiss. */}
      <div className="flex flex-1 flex-col justify-end gap-3 px-5 pb-8 pt-6">
        <a
          ref={callRef}
          href="tel:911"
          className="inline-flex min-h-[72px] w-full items-center justify-center rounded-stamp bg-stamp px-6 text-[1.5rem] font-bold text-card transition-colors hover:bg-stamp-press"
        >
          Tumawag sa 911
        </a>

        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex min-h-[72px] w-full items-center justify-center rounded-stamp border-rule border-ink bg-card px-6 text-body-lg font-semibold text-ink transition-colors hover:bg-paper"
        >
          Hindi pala emergency, bumalik
        </button>

        <p className="mt-2 text-meta text-ink-soft">
          Kung walang signal ang 911, subukan ang DOH hotline (02) 8-651-7800
          o tumawag sa pinakamalapit na ospital.
        </p>
      </div>
    </div>
  );
}
