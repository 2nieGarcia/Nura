import { APP_COPY } from "../../constants/app";
import type { Facility } from "../../types/facility";
import { AlternateRow, PrimaryRecommendation } from "../ui/FacilityCard";

/**
 * ResultsScreen — the answer hierarchy.
 *
 * Zones, in order of importance:
 *   1. Echo of the user's question (so they know the system heard them).
 *   2. The single primary recommendation (PrimaryRecommendation).
 *   3. Alternates as a compressed list (AlternateRow).
 *   4. A single source/disclaimer line under everything.
 *
 * Failure modes handled:
 *   - error present → the recommendation block is replaced by an alert.
 *   - empty facilities (no error) → polite empty-state with reset CTA.
 *
 * What was removed:
 *   - The chat-style "reply" paragraph card. Reply text was generic AI
 *     prose ("Hindi ako doktor, pero...") and competed with the primary
 *     recommendation. Its useful content is now embedded in the
 *     PrimaryRecommendation's own sentence.
 *   - The corner reliability badges. Replaced by a plain-language source
 *     sentence inside the primary card.
 */
type ResultsScreenProps = {
  facilities: Facility[];
  reply: string;
  error: string | null;
  concern: string;
  location: string;
  onReset: () => void;
};

export function ResultsScreen({
  facilities,
  error,
  concern,
  location,
  onReset,
}: ResultsScreenProps): JSX.Element {
  const [primary, ...alternates] = facilities;

  return (
    <section className="paper-in flex flex-1 flex-col px-5 pb-8 pt-5">
      {/* Zone 0 — the echo. Reassures the user the system actually heard them. */}
      <p className="font-mono text-label uppercase text-seal">Resulta</p>
      <h2 className="mt-2 font-display text-[1.5rem] leading-snug text-ink">
        Para sa <span className="italic">{concern || "iyong concern"}</span> sa{" "}
        <span className="italic">{location || "lugar mo"}</span>:
      </h2>

      {/* Zone 1 — the answer */}
      <div className="mt-6">
        {error ? (
          <div
            role="alert"
            className="border-l-rule border-mark bg-mark-bg px-4 py-3 text-body text-ink"
          >
            {error}
          </div>
        ) : primary ? (
          <PrimaryRecommendation facility={primary} concern={concern} />
        ) : (
          <p className="border-l-rule border-ink/30 bg-card px-4 py-4 text-body text-ink-soft">
            {APP_COPY.noResults}
          </p>
        )}
      </div>

      {/* Zone 3 — alternates as a compressed list */}
      {alternates.length > 0 && (
        <div className="mt-8">
          <p className="font-mono text-label uppercase text-ink-soft">
            Iba pang pwede
          </p>
          <ul className="mt-2">
            {alternates.map((facility, i) => (
              <AlternateRow
                key={facility.id ?? `${facility.name}-${i}`}
                facility={facility}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Footer — single trust sentence + reset */}
      <div className="mt-10 border-t border-paper-edge pt-4">
        <p className="text-meta text-ink-soft">
          Hindi ito medical advice. Kung lumala ang sintomas, pumunta agad
          sa pinakamalapit na Emergency Room o tumawag sa 911.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-form border-rule border-ink/15 bg-card px-5 text-body font-semibold text-ink transition-colors hover:border-seal hover:text-seal"
        >
          Mag-search ulit
        </button>
      </div>
    </section>
  );
}
