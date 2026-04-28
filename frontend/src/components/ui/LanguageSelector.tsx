import {
  LANGUAGE_OPTIONS,
  type LanguageCode,
} from "../../types/language";

type LanguageSelectorProps = {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
  className?: string;
};

export function LanguageSelector({
  value,
  onChange,
  className = "",
}: LanguageSelectorProps): JSX.Element {
  return (
    <select
      id="language-selector"
      value={value}
      onChange={(event) => onChange(event.target.value as LanguageCode)}
      className={[
        "min-h-11 w-full min-w-0 rounded-form border border-paper-edge bg-card px-3 text-meta font-semibold text-ink shadow-sm transition-colors focus:border-seal",
        className,
      ].join(" ")}
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
