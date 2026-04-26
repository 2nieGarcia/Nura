import { APP_COPY, BENEFIT_OPTIONS } from "../../constants/app";
import type { BenefitProfile } from "../../types/benefits";
import { BenefitRow } from "../ui/BenefitRow";

type BenefitPickerCardProps = {
  benefits: BenefitProfile;
  onToggle: (key: keyof BenefitProfile) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled?: boolean;
};

export function BenefitPickerCard({
  benefits,
  onToggle,
  onSubmit,
  isLoading,
  disabled = false,
}: BenefitPickerCardProps): JSX.Element {
  const real = BENEFIT_OPTIONS.filter((option) => !option.isNone);
  const none = BENEFIT_OPTIONS.find((option) => option.isNone);
  const hasSelection = Object.values(benefits).some(Boolean);
  const isDisabled = disabled || isLoading;

  return (
    <div className="message-enter w-full max-w-[30rem] rounded-form border border-paper-edge bg-card px-4 py-4 shadow-sm">
      <fieldset disabled={isDisabled}>
        <legend className="font-mono text-label uppercase text-seal">
          Benefit
        </legend>
        <p className="mt-2 text-body text-ink">
          Piliin lahat ng applicable. Okay lang kung wala o hindi sure.
        </p>

        <div className="mt-4 divide-y divide-paper-edge rounded-form border border-paper-edge px-3">
          {real.map((option) => (
            <BenefitRow
              key={option.key}
              option={option}
              selected={benefits[option.key]}
              onToggle={() => onToggle(option.key)}
              disabled={isDisabled}
            />
          ))}
        </div>

        {none && (
          <div className="mt-5">
            <p className="font-mono text-label uppercase text-ink-soft">
              O kung wala
            </p>
            <div className="mt-2 rounded-form border border-paper-edge px-3">
              <BenefitRow
                option={none}
                selected={benefits[none.key]}
                onToggle={() => onToggle(none.key)}
                disabled={isDisabled}
              />
            </div>
            {benefits.noBenefits && (
              <p
                className="mt-3 border-l-rule border-seal bg-paper px-3 py-2 text-meta text-ink"
                role="status"
              >
                {APP_COPY.noBenefitNote}
              </p>
            )}
          </div>
        )}
      </fieldset>

      <button
        id="benefit-submit-button"
        type="button"
        onClick={onSubmit}
        disabled={!hasSelection || isDisabled}
        className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-form bg-seal px-5 text-body font-semibold text-card transition-colors hover:bg-seal-press active:bg-seal-press disabled:cursor-not-allowed disabled:bg-paper-edge disabled:text-ink-mute"
      >
        {isLoading ? "Hinahanap..." : APP_COPY.benefitSubmit}
      </button>
    </div>
  );
}
