type QuickRepliesProps = {
  options: readonly string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
};

export function QuickReplies({
  options,
  onSelect,
  disabled = false,
}: QuickRepliesProps): JSX.Element {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          disabled={disabled}
          className="min-h-[40px] rounded-full border-[1.5px] border-seal bg-transparent px-4 py-2 text-meta font-semibold text-seal transition-transform duration-150 active:scale-[0.96] disabled:cursor-not-allowed disabled:border-paper-edge disabled:text-ink-mute"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
