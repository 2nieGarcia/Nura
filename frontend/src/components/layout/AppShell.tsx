import type { ReactNode } from "react";

/**
 * AppShell — the Nura letterhead.
 *
 * The header now uses the actual Nura "N" mark (cropped from the source
 * logo file). Width and height are constrained explicitly with `h-auto` so
 * the natural ~1.04:1 aspect ratio is preserved — no squishing.
 *
 * The mark sits to the left of the Fraunces wordmark and tagline, sized at
 * 40px tall to register as a brand presence without dominating the
 * letterhead. A hairline rule under the row preserves the form-feel.
 */
type AppShellProps = {
  showHeader?: boolean;
  children: ReactNode;
};

export function AppShell({ showHeader = true, children }: AppShellProps): JSX.Element {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[28rem] flex-col bg-paper">
      {showHeader && (
        <header className="px-5 pb-3 pt-5">
          <div className="flex items-center gap-3">
            {/* Real Nura mark — natural aspect ratio preserved via h-auto. */}
            <img
              src="/logo-mark.png"
              alt="Nura"
              width={42}
              height={40}
              className="h-10 w-auto flex-shrink-0 select-none"
              draggable={false}
            />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[1.5rem] font-semibold leading-none tracking-tight text-ink">
                Nura
              </h1>
              <p className="mt-1 text-meta text-ink-soft">
                Hindi doktor. Gabay sa pasilidad at benepisyo.
              </p>
            </div>
          </div>
          {/* Hairline rule under the letterhead, like a paper form. */}
          <div className="mt-4 h-px w-full bg-paper-edge" />
        </header>
      )}
      <main className="flex flex-1 flex-col safe-bottom">{children}</main>
    </div>
  );
}
