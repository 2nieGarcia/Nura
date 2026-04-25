import { APP_COPY, BENEFIT_OPTIONS } from "../../constants/app";
import type { BenefitProfile } from "../../types/benefits";
import { BenefitCard } from "../ui/BenefitCard";
import { StepIndicator } from "../ui/StepIndicator";

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

  return (
    <div className="screen-enter flex flex-1 flex-col px-5 py-6">
      <StepIndicator currentStep={2} />

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-nura-text">
          {APP_COPY.benefitLabel}
        </h2>
        <p className="mt-1 text-sm text-nura-text-light">
          {APP_COPY.benefitHint}
        </p>
      </div>

      {/* Benefit cards */}
      <div className="mt-5 flex-1 space-y-3 overflow-y-auto pb-4">
        {BENEFIT_OPTIONS.map((option) => (
          <BenefitCard
            key={option.key}
            option={option}
            selected={benefits[option.key]}
            onToggle={() => onToggle(option.key)}
            disabled={isLoading}
          />
        ))}
      </div>

      {/* No benefit note */}
      {benefits.noBenefits && (
        <p className="mb-3 rounded-xl bg-nura-primary/5 px-4 py-3 text-xs text-nura-primary">
          {APP_COPY.noBenefitNote}
        </p>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!hasSelection || isLoading}
        className="w-full rounded-2xl bg-nura-primary px-6 py-4 text-base font-semibold text-white shadow-soft transition-all duration-150 hover:bg-nura-primary-hover active:scale-[0.98] disabled:bg-nura-border disabled:text-nura-muted disabled:shadow-none"
      >
        {isLoading ? "Hinahanap..." : `${APP_COPY.benefitSubmit} →`}
      </button>
    </div>
  );
}
