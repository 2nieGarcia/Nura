import type { ReactNode } from "react";

type BotBubbleProps = {
  children: ReactNode;
};

export function BotBubble({ children }: BotBubbleProps): JSX.Element {
  return (
    <div className="message-enter flex max-w-[85%] items-start gap-2">
      <span
        aria-hidden="true"
        className="mt-6 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-pin"
      />
      <div className="min-w-0">
        <p className="mb-1 font-mono text-label uppercase text-ink-soft">
          Nura
        </p>
        <div className="rounded-bl-block rounded-br-block rounded-tl-[2px] rounded-tr-block border border-paper-edge bg-card px-4 py-3 text-body text-ink shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
