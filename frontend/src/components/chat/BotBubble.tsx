import type { ReactNode } from "react";

type BotBubbleProps = {
  children: ReactNode;
};

export function BotBubble({ children }: BotBubbleProps): JSX.Element {
  return (
    <div className="message-enter flex w-full items-start gap-2">
      <span
        aria-hidden="true"
        className="mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border border-paper-edge bg-card font-display text-[0.72rem] font-semibold text-seal"
      >
        N
      </span>
      <div className="min-w-0 max-w-[calc(100%-2rem)] sm:max-w-[27rem]">
        <p className="mb-1 font-mono text-label uppercase text-ink-soft">
          Nura
        </p>
        <div className="rounded-form border border-paper-edge bg-card px-3.5 py-3 text-body leading-6 text-ink shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
