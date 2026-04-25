export const LANGUAGE_OPTIONS = [
  { code: "auto", label: "Auto" },
  { code: "fil", label: "Filipino" },
  { code: "ceb", label: "Cebuano" },
  { code: "ilo", label: "Ilocano" },
  { code: "hil", label: "Hiligaynon" },
  { code: "en", label: "English" },
] as const;

export type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["code"];

export const DEFAULT_LANGUAGE: LanguageCode = "fil";

export function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGE_OPTIONS.some((option) => option.code === value);
}

export function getLanguageLabel(code: LanguageCode): string {
  return LANGUAGE_OPTIONS.find((option) => option.code === code)?.label ?? "Filipino";
}
