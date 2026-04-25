type ChipProps = {
  label: string;
  selected?: boolean;
  onTap: () => void;
  variant?: "default" | "muted";
};

export function Chip({ label, selected, onTap, variant = "default" }: ChipProps): JSX.Element {
  const base =
    "chip-tap inline-flex items-center rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer select-none border";

  const styles =
    variant === "muted"
      ? selected
        ? "bg-nura-muted/10 border-nura-muted text-nura-muted"
        : "bg-white border-nura-border text-nura-muted hover:border-nura-muted/40"
      : selected
        ? "bg-nura-primary text-white border-nura-primary shadow-soft"
        : "bg-white border-nura-border text-nura-text hover:border-nura-primary/40 hover:bg-nura-primary/5";

  return (
    <button
      type="button"
      className={`${base} ${styles}`}
      onClick={onTap}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}
