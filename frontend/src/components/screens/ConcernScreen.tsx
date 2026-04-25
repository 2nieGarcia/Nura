import { FormEvent } from "react";
import { APP_COPY, CONCERN_CHIPS } from "../../constants/app";
import { Chip } from "../ui/Chip";
import { StepIndicator } from "../ui/StepIndicator";

type ConcernScreenProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function ConcernScreen({ value, onChange, onSubmit }: ConcernScreenProps): JSX.Element {
  const canSubmit = value.trim().length > 0;

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (canSubmit) onSubmit();
  };

  const handleChipTap = (chip: string): void => {
    onChange(chip);
  };

  return (
    <div className="screen-enter flex flex-1 flex-col px-5 py-6">
      <StepIndicator currentStep={0} />

      <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col">
        <label
          htmlFor="concern-input"
          className="text-lg font-semibold text-nura-text"
        >
          {APP_COPY.concernLabel}
        </label>
        <p className="mt-1 text-sm text-nura-text-light">
          Sabihin lang sa sarili mong salita. Hindi kailangan ng medical terms.
        </p>

        <textarea
          id="concern-input"
          className="mt-4 min-h-[120px] w-full resize-none rounded-2xl border-2 border-nura-border bg-white px-4 py-3 text-sm leading-relaxed text-nura-text placeholder:text-nura-muted/60 focus:border-nura-primary focus:outline-none focus:ring-0 transition-colors"
          placeholder={APP_COPY.concernPlaceholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />

        {/* Quick chips */}
        <p className="mt-5 text-xs font-medium text-nura-muted">
          {APP_COPY.concernHint}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONCERN_CHIPS.map((chip) => (
            <Chip
              key={chip}
              label={chip}
              selected={value === chip}
              onTap={() => handleChipTap(chip)}
            />
          ))}
        </div>

        {/* Submit */}
        <div className="mt-auto pt-6">
          {value.trim().length > 0 && value.trim().length < 3 && (
            <p className="mb-2 text-xs text-nura-warning">
              Dagdagan ng konti para mas accurate ang resulta.
            </p>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-2xl bg-nura-primary px-6 py-4 text-base font-semibold text-white shadow-soft transition-all duration-150 hover:bg-nura-primary-hover active:scale-[0.98] disabled:bg-nura-border disabled:text-nura-muted disabled:shadow-none"
          >
            {APP_COPY.nextButton} →
          </button>
        </div>
      </form>
    </div>
  );
}
