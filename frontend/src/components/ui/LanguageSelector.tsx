import {
  LANGUAGE_OPTIONS,
  type LanguageCode,
} from "../../types/language";

type LanguageSelectorProps = {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
};

export function LanguageSelector({
  value,
  onChange,
}: LanguageSelectorProps): JSX.Element {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as LanguageCode)}
      className="min-h-9 max-w-[8.5rem] rounded-form border border-paper-edge bg-card px-2 text-meta font-semibold text-ink-soft shadow-sm focus:border-seal"
      aria-label="Piliin ang wika"
    >
      {LANGUAGE_OPTIONS.map((option) => (
        <option key={option.code} value={option.code}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
