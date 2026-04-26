import type { ReactNode } from "react";
import type { ThemeMode } from "../../lib/theme";
import type { LanguageCode } from "../../types/language";
import { LanguageSelector } from "../ui/LanguageSelector";

type AppShellProps = {
  showHeader?: boolean;
  language?: LanguageCode;
  onLanguageChange?: (value: LanguageCode) => void;
  hasCarePass?: boolean;
  onOpenCarePass?: () => void;
  onNewConversation?: () => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  children: ReactNode;
};

const headerButtonClass =
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-form border border-paper-edge bg-card px-3 text-meta font-semibold text-seal shadow-sm transition-colors hover:border-seal hover:bg-pin-soft active:bg-pin-soft";

function ThemeIcon({ theme }: { theme: ThemeMode }): JSX.Element {
  if (theme === "dark") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7.5 7.5 0 1 0 20.5 14.5Z" />
    </svg>
  );
}

export function AppShell({
  showHeader = true,
  language,
  onLanguageChange,
  hasCarePass = false,
  onOpenCarePass,
  onNewConversation,
  theme = "light",
  onToggleTheme,
  children,
}: AppShellProps): JSX.Element {
  const showHeaderControls =
    (language !== undefined && onLanguageChange !== undefined) ||
    onOpenCarePass !== undefined ||
    onNewConversation !== undefined;

  return (
    <div className="mx-auto flex h-[100dvh] min-h-[100dvh] w-full max-w-[34rem] flex-col overflow-hidden bg-paper text-ink sm:border-x sm:border-paper-edge">
      {showHeader && (
        <header className="flex-shrink-0 border-b border-paper-edge bg-paper/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] backdrop-blur">
          <div className="flex items-start gap-3">
            <img
              src="/logo-mark.png"
              alt="Nura"
              width={44}
              height={42}
              className="h-10 w-auto flex-shrink-0 select-none"
              draggable={false}
            />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[1.45rem] font-semibold leading-none text-ink">
                Nura
              </h1>
              <p className="mt-1 max-w-[22rem] text-[0.82rem] leading-5 text-ink-soft">
                Hindi doktor. Gabay sa pasilidad at benepisyo.
              </p>
            </div>
            {onToggleTheme && (
              <button
                id="theme-toggle-button"
                type="button"
                onClick={onToggleTheme}
                aria-label={
                  theme === "dark"
                    ? "Lumipat sa light mode"
                    : "Lumipat sa dark mode"
                }
                title={theme === "dark" ? "Light mode" : "Dark mode"}
                className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-form border border-paper-edge bg-card text-seal shadow-sm transition-colors hover:border-seal hover:bg-pin-soft active:bg-pin-soft"
              >
                <ThemeIcon theme={theme} />
              </button>
            )}
          </div>

          {showHeaderControls ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {language && onLanguageChange && (
                <div className="col-span-2">
                  <LanguageSelector
                    value={language}
                    onChange={onLanguageChange}
                  />
                </div>
              )}
              {onNewConversation && (
                <button
                  id="new-conversation-button"
                  type="button"
                  onClick={onNewConversation}
                  className={headerButtonClass}
                >
                  Bagong usapan
                </button>
              )}
              {onOpenCarePass && (
                <button
                  id="open-care-pass-button"
                  type="button"
                  onClick={onOpenCarePass}
                  className={[
                    headerButtonClass,
                    hasCarePass ? "" : "text-ink-soft",
                  ].join(" ")}
                >
                  Last Pass
                </button>
              )}
            </div>
          ) : null}
        </header>
      )}
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
