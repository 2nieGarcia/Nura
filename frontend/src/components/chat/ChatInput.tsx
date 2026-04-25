import type { FormEvent } from "react";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder: string;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder,
}: ChatInputProps): JSX.Element {
  const canSend = value.trim().length > 0 && !disabled;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSend) return;
    onSend();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 border-t border-paper-edge bg-card px-4 pb-3 pt-3"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="min-h-[48px] min-w-0 flex-1 rounded-form border border-paper-edge bg-paper px-4 text-body text-ink placeholder:text-ink-mute disabled:cursor-not-allowed disabled:bg-paper-edge/50"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Ipadala"
          className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-seal text-card transition-colors hover:bg-seal-press active:bg-seal-press disabled:cursor-not-allowed disabled:bg-paper-edge disabled:text-ink-mute"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </form>
  );
}
