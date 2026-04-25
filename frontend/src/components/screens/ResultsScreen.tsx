import { APP_COPY } from "../../constants/app";
import type { Facility } from "../../types/facility";
import { FacilityCard } from "../ui/FacilityCard";
import { StepIndicator } from "../ui/StepIndicator";

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
  reply,
  error,
  concern,
  location,
  onReset,
}: ResultsScreenProps): JSX.Element {
  return (
    <div className="screen-enter flex flex-1 flex-col px-5 py-6">
      <StepIndicator currentStep={3} />

      {/* Context summary */}
      <div className="mt-6 rounded-2xl bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-nura-primary/10 px-3 py-1 font-medium text-nura-primary">
            {concern}
          </span>
          <span className="text-nura-muted">sa</span>
          <span className="rounded-full bg-nura-accent/10 px-3 py-1 font-medium text-nura-accent">
            {location}
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          {error}
        </div>
      )}

      {/* Reply */}
      {reply && (
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-soft">
          <p className="text-sm leading-relaxed text-nura-text-light">{reply}</p>
        </div>
      )}

      {/* Facilities */}
      {facilities.length > 0 ? (
        <div className="mt-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-nura-muted">
            Mga Recommended na Pasilidad
          </h2>
          {facilities.map((facility, index) => (
            <FacilityCard
              key={facility.id ?? `${facility.name}-${index}`}
              facility={facility}
              index={index}
            />
          ))}
        </div>
      ) : !error ? (
        <div className="mt-8 text-center">
          <p className="text-sm text-nura-muted">{APP_COPY.noResults}</p>
        </div>
      ) : null}

      {/* Reset */}
      <div className="mt-8 pb-4">
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-2xl border-2 border-nura-border bg-white px-6 py-4 text-base font-semibold text-nura-text transition-all duration-150 hover:border-nura-primary/30 hover:bg-nura-primary/5 active:scale-[0.98]"
        >
          ← {APP_COPY.resetButton}
        </button>
      </div>
    </div>
  );
}
