import { APP_COPY, BENEFIT_OPTIONS } from "../../constants/app";
import type { BenefitProfile } from "../../types/benefits";
import { BenefitRow } from "../ui/BenefitRow";

/**
 * BenefitScreen — Step 3 of 3.
 *
 * Real <fieldset>/<legend> form semantics; native checkboxes via BenefitRow.
 * "Wala / hindi sure" is pinned at the bottom under a hairline rule with
 * explicit copy ("okay rin yan") so users without coverage don't bounce.
 */
type BenefitScreenProps = {
  benefits: BenefitProfile;
  onToggle: (key: keyof BenefitProfile) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function BenefitScreen({
  benefits,
  onToggle,
  onSubmit,
  isLoading,
}: BenefitScreenProps): JSX.Element {
  const hasSelection = Object.values(benefits).some(Boolean);

  // Split the "none" option from the rest so we can rule it off at the bottom.
  const real = BENEFIT_OPTIONS.filter((o) => !o.isNone);
  const none = BENEFIT_OPTIONS.find((o) => o.isNone);

  return (
    <section className="paper-in flex flex-1 flex-col px-5 pb-6 pt-5">
      <p className="font-mono text-label uppercase text-seal">
        Tanong 3 ng 3
      </p>

      <h2 className="mt-2 font-display text-display text-ink">
        May benefit ka ba?
      </h2>
      <p className="mt-3 text-body text-ink-soft">
        Piliin lahat ng applicable. Okay lang kung hindi sure — may libreng
        options pa rin sa health center.
      </p>

      <fieldset className="mt-5 flex flex-1 flex-col">
        <legend className="sr-only">{APP_COPY.benefitLabel}</legend>

        {/* Real benefits, divided by hairline rules (form-feel). */}
        <div className="divide-y divide-paper-edge border-y border-paper-edge">
          {real.map((option) => (
            <BenefitRow
              key={option.key}
              option={option}
              selected={benefits[option.key]}
              onToggle={() => onToggle(option.key)}
              disabled={isLoading}
            />
          ))}
        </div>

        {/* "Wala / hindi sure" pinned and ruled off — never feels like a wrong answer. */}
        {none && (
          <div className="mt-6">
            <p className="font-mono text-label uppercase text-ink-soft">
              O kung wala
            </p>
            <div className="mt-2 border-y border-paper-edge">
              <BenefitRow
                option={none}
                selected={benefits[none.key]}
                onToggle={() => onToggle(none.key)}
                disabled={isLoading}
              />
            </div>
            {benefits.noBenefits && (
              <p
                className="mt-3 border-l-rule border-seal bg-card px-3 py-2 text-meta text-ink"
                role="status"
              >
                {APP_COPY.noBenefitNote}
              </p>
            )}
          </div>
        )}
      </fieldset>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!hasSelection || isLoading}
        className="mt-8 inline-flex min-h-[56px] w-full items-center justify-center rounded-form bg-seal px-6 text-body-lg font-semibold text-card transition-colors hover:bg-seal-press disabled:cursor-not-allowed disabled:bg-paper-edge disabled:text-ink-mute"
      >
        {isLoading ? "Hinahanap..." : "Hanapin ang pasilidad"}
      </button>
    </section>
  );
}
