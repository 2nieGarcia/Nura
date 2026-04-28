import type { BenefitOption } from "../../constants/app";

/**
 * BenefitRow — a real <input type="checkbox"> + <label> row.
 *
 * Why not the previous BenefitCard:
 * - The old card was a <button aria-pressed> with a custom 20px check dot.
 *   That works for AT but pushes the tap target to "the dot" visually, which
 *   is the opposite of Fitts's Law on a phone.
 * - This version makes the entire row label the click target via <label
 *   htmlFor>, uses native checkbox semantics (free spacebar/space toggle, no
 *   ARIA invented), and renders a 22px square tick that matches the form
 *   register of the rest of the app.
 */
type BenefitRowProps = {
  option: BenefitOption;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export function BenefitRow({
  option,
  selected,
  onToggle,
  disabled,
}: BenefitRowProps): JSX.Element {
  const id = `benefit-${option.key}`;

  return (
    <div className="flex items-start gap-3 py-3">
      <input
        id={id}
        type="checkbox"
        checked={selected}
        disabled={disabled}
        onChange={onToggle}
        // Hide the default checkbox visual; we draw our own beside the label.
        // The native input remains in the tab order and accessibility tree.
        className="peer sr-only"
      />
      <label
        htmlFor={id}
          className={[
          "flex min-h-[44px] flex-1 cursor-pointer items-start gap-3",
          disabled ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {/* Custom tick. Bordered square to match form register. */}
        <span
          aria-hidden="true"
          className={[
            "mt-0.5 grid h-[22px] w-[22px] flex-shrink-0 place-items-center",
            "rounded-stamp border-rule transition-colors duration-150",
            selected ? "border-seal bg-seal" : "border-paper-edge bg-card",
            // Mirror the focus ring of the hidden native checkbox.
            "peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-seal peer-focus-visible:outline-offset-2",
          ].join(" ")}
        >
          {selected && (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
              <path
                d="M3 8.5l3 3 7-7"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-body font-semibold text-ink">
            {option.label}
          </span>
          <span className="mt-0.5 block text-meta text-ink-soft">
            {option.description}
          </span>
        </span>
      </label>
    </div>
  );
}
