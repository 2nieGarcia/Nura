import type { ReactNode } from "react";
import { APP_COPY } from "../../constants/app";

type AppShellProps = {
  showHeader?: boolean;
  children: ReactNode;
};

export function AppShell({ showHeader = true, children }: AppShellProps): JSX.Element {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col bg-nura-bg">
      {showHeader && (
        <header className="flex items-center gap-3 px-5 pb-2 pt-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-nura-primary">
            <span className="text-sm font-bold text-white">N</span>
          </div>
          <div>
            <h1 className="text-base font-semibold text-nura-text">{APP_COPY.title}</h1>
            <p className="text-[11px] text-nura-muted">{APP_COPY.subtitle}</p>
          </div>
        </header>
      )}
      <main className="flex flex-1 flex-col safe-bottom">{children}</main>
    </div>
  );
}
