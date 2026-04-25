/**
 * Chip — quick-pick word button.
 *
 * Was: rounded-full pill in two variants — the universal SaaS chip pattern.
 * Now: an underlined word with a thicker rule when selected, and a small
 * tap-target box that hits 44px height. This reads as "circle the option on
 * a form" rather than "tap a bubble in a dashboard". It also stops competing
 * with the primary CTA for visual weight.
 *
 * Accessibility: button + aria-pressed (true selection semantics, no
 * checkbox needed because behaviour is "replace value", not "toggle set").
 */
type ChipProps = {
  label: string;
  selected?: boolean;
  onTap: () => void;
};

export function Chip({ label, selected, onTap }: ChipProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-pressed={selected}
      className={[
        // 44px minimum tap target via py + leading
        "inline-flex min-h-[44px] items-center px-1 py-2 text-body font-medium",
        "border-b-2 transition-colors duration-150",
        selected
          ? "text-seal border-seal"
          : "text-ink border-paper-edge hover:text-seal hover:border-seal/40",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
