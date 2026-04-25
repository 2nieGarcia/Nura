import { FormEvent } from "react";

type ChatInputProps = {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function ChatInput({ value, disabled, onChange, onSubmit }: ChatInputProps): JSX.Element {
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
      <label htmlFor="chat-message" className="block text-sm font-semibold text-slate-800">
        Symptoms or concern
      </label>
      <textarea
        id="chat-message"
        className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-service-accent focus:outline-none focus:ring-2 focus:ring-cyan-100"
        placeholder="Halimbawa: Masakit mata ko, 3 days na."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        className="w-full rounded-xl bg-service-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {disabled ? "Nagsesend..." : "I-send"}
      </button>
    </form>
  );
}
