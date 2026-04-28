type QuickRepliesProps = {
  options: readonly string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
};

function optionId(option: string, index: number): string {
  return `quick-reply-${index}-${option
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export function QuickReplies({
  options,
  onSelect,
  disabled = false,
}: QuickRepliesProps): JSX.Element {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((option, index) => (
        <button
          key={option}
          id={optionId(option, index)}
          type="button"
          onClick={() => onSelect(option)}
          disabled={disabled}
          className="inline-flex min-h-11 min-w-[8rem] flex-1 basis-[calc(50%-0.25rem)] items-center justify-center rounded-form border border-paper-edge bg-paper px-3 py-2 text-center text-meta font-semibold leading-tight text-seal transition-colors hover:border-seal hover:bg-pin-soft active:bg-pin-soft disabled:cursor-not-allowed disabled:text-ink-mute"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
