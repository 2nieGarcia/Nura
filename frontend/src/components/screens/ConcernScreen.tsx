import { FormEvent } from "react";
import { APP_COPY, CONCERN_CHIPS } from "../../constants/app";
import { Chip } from "../ui/Chip";

/**
 * ConcernScreen — Step 1 of 3.
 *
 * The previous version used a transparent textarea with only a bottom rule.
 * That worked when the user typed a paragraph, but when a chip ("Check-up
 * lang") was tapped, the single short line of text appeared to float above
 * the rule with no visible field. Real users read this as a layout bug.
 *
 * Fix: the input now lives inside an explicit white card with a left rule
 * that turns navy on focus or when filled. A small "Tinanggap" pin-line
 * appears under the field when a chip selection is active, so the user
 * gets clear feedback that their tap was captured into the answer.
 */
type ConcernScreenProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function ConcernScreen({ value, onChange, onSubmit }: ConcernScreenProps): JSX.Element {
  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0;
  const tooShort = trimmed.length > 0 && trimmed.length < 3;
  const isFromChip = CONCERN_CHIPS.includes(trimmed);

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (canSubmit) onSubmit();
  };

  return (
    <section className="paper-in flex flex-1 flex-col px-5 pb-6 pt-5">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <p className="font-mono text-label uppercase text-seal">
          Tanong 1 ng 3
        </p>

        <h2 className="mt-2 font-display text-display text-ink">
          Ano ang concern mo ngayon?
        </h2>
        <p className="mt-3 text-body text-ink-soft">
          Sabihin sa sarili mong salita. Taglish okay. Hindi kailangan ng
          medical terms.
        </p>

        {/* Field: real card surface so a one-word entry is anchored, not
            floating over paper. Left rule turns navy when filled / focused. */}
        <div className="mt-6">
          <label htmlFor="concern-input" className="sr-only">
            {APP_COPY.concernLabel}
          </label>
          <div
            className={[
              "rounded-form border-l-rule bg-card",
              "transition-colors duration-150",
              "focus-within:border-seal",
              canSubmit ? "border-seal" : "border-paper-edge",
            ].join(" ")}
          >
            <textarea
              id="concern-input"
              className="block w-full resize-none bg-transparent px-4 py-3 text-body-lg text-ink placeholder:text-ink-mute focus:outline-none"
              rows={3}
              placeholder={APP_COPY.concernPlaceholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              autoFocus
            />
          </div>
          {/* Confirmation line that only shows when a chip filled the field.
              Removes the 'floating short word' ambiguity by making the
              feedback explicit. */}
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

        {/* Quick-pick word buttons. Form register, not pill chips. */}
        <p className="mt-6 text-meta text-ink-soft">
          O pumili sa mga madalas:
        </p>
        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
          {CONCERN_CHIPS.map((chip) => (
            <Chip
              key={chip}
              label={chip}
              selected={value === chip}
              onTap={() => onChange(chip)}
            />
          ))}
        </div>

        {/* Bottom-anchored CTA + length warning. */}
        <div className="mt-auto pt-8">
          {tooShort && (
            <p
              className="mb-3 border-l-rule border-mark bg-mark-bg px-3 py-2 text-meta text-ink"
              role="status"
              aria-live="polite"
            >
              Pakidagdagan ng konti para mas accurate ang resulta.
            </p>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex min-h-[56px] w-full items-center justify-center rounded-form bg-seal px-6 text-body-lg font-semibold text-card transition-colors hover:bg-seal-press disabled:cursor-not-allowed disabled:bg-paper-edge disabled:text-ink-mute"
          >
            Susunod: Saan ka?
          </button>
        </div>
      </form>
    </section>
  );
}
