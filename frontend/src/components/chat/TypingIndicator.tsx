type TypingIndicatorProps = {
  content?: string;
};

export function TypingIndicator({ content }: TypingIndicatorProps): JSX.Element {
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
