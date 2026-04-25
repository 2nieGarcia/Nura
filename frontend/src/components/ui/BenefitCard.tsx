import type { BenefitOption } from "../../constants/app";

type BenefitCardProps = {
  option: BenefitOption;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export function BenefitCard({
  option,
  selected,
  onToggle,
  disabled,
}: BenefitCardProps): JSX.Element {
  const isNone = option.isNone === true;

  const cardStyles = isNone
    ? selected
      ? "border-nura-muted bg-nura-muted/5"
      : "border-dashed border-nura-border bg-white hover:border-nura-muted/40"
    : selected
      ? "border-nura-primary bg-nura-primary/5 shadow-card"
      : "border-nura-border bg-white hover:border-nura-primary/30 hover:shadow-soft";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`chip-tap w-full rounded-2xl border-2 p-4 text-left transition-all duration-150 disabled:opacity-50 ${cardStyles}`}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className={`text-sm font-semibold ${
              isNone ? "text-nura-muted" : "text-nura-text"
            }`}
          >
            {option.label}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-nura-text-light">
            {option.description}
          </p>
        </div>
        <div
          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            selected
              ? isNone
                ? "border-nura-muted bg-nura-muted text-white"
                : "border-nura-primary bg-nura-primary text-white"
              : "border-nura-border bg-white"
          }`}
        >
          {selected && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}
