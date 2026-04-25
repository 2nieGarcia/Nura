import { FormEvent } from "react";
import { APP_COPY, LOCATION_CHIPS } from "../../constants/app";
import { Chip } from "../ui/Chip";

/**
 * LocationScreen — Step 2 of 3.
 *
 * Mirrors ConcernScreen's field treatment: the input lives inside a card
 * surface with a left rule that activates when filled or focused. Same
 * "Tinanggap" confirmation line appears when a city chip is tapped, so the
 * single-word selection no longer reads as floating text above an empty
 * rule.
 */
type LocationScreenProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function LocationScreen({ value, onChange, onSubmit }: LocationScreenProps): JSX.Element {
  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0;
  const isFromChip = LOCATION_CHIPS.includes(trimmed);

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (canSubmit) onSubmit();
  };

  return (
    <section className="paper-in flex flex-1 flex-col px-5 pb-6 pt-5">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <p className="font-mono text-label uppercase text-seal">
          Tanong 2 ng 3
        </p>

        <h2 className="mt-2 font-display text-display text-ink">
          Saan ka ngayon?
        </h2>
        <p className="mt-3 text-body text-ink-soft">
          Para mahanap ko ang pasilidad na malapit sa'yo. City o barangay,
          okay na yan.
        </p>

        <div className="mt-6">
          <label htmlFor="location-input" className="sr-only">
            {APP_COPY.locationLabel}
          </label>
          <div
            className={[
              "rounded-form border-l-rule bg-card",
              "transition-colors duration-150",
              "focus-within:border-seal",
              canSubmit ? "border-seal" : "border-paper-edge",
            ].join(" ")}
          >
            <input
              id="location-input"
              type="text"
              inputMode="text"
              autoComplete="address-level2"
              className="block w-full bg-transparent px-4 py-3 text-body-lg text-ink placeholder:text-ink-mute focus:outline-none"
              placeholder={APP_COPY.locationPlaceholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              autoFocus
            />
          </div>
          {isFromChip && (
            <p
              className="mt-2 inline-flex items-center gap-2 text-meta text-pin-press"
              role="status"
              aria-live="polite"
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-pin" />
              Tinanggap: <span className="font-medium text-ink">{trimmed}</span>
            </p>
          )}
        </div>

        <p className="mt-6 text-meta text-ink-soft">
          O pumili ng city:
        </p>
        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
          {LOCATION_CHIPS.map((chip) => (
            <Chip
              key={chip}
              label={chip}
              selected={value === chip}
              onTap={() => onChange(chip)}
            />
          ))}
        </div>

        <div className="mt-auto pt-8">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex min-h-[56px] w-full items-center justify-center rounded-form bg-seal px-6 text-body-lg font-semibold text-card transition-colors hover:bg-seal-press disabled:cursor-not-allowed disabled:bg-paper-edge disabled:text-ink-mute"
          >
            Susunod: Benefit
          </button>
        </div>
      </form>
    </section>
  );
}
