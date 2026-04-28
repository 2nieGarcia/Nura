type TypingIndicatorProps = {
  content?: string;
};

export function TypingIndicator({ content }: TypingIndicatorProps): JSX.Element {
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
        <div className="rounded-form border border-paper-edge bg-card px-3.5 py-3 text-body text-ink shadow-sm">
          <div className="flex items-center gap-1.5" aria-label="Nura is typing">
            <span className="typing-dot h-2 w-2 rounded-full bg-seal" />
            <span className="typing-dot h-2 w-2 rounded-full bg-seal [animation-delay:120ms]" />
            <span className="typing-dot h-2 w-2 rounded-full bg-seal [animation-delay:240ms]" />
          </div>
          {content && (
            <p className="mt-2 text-meta text-ink-soft">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
