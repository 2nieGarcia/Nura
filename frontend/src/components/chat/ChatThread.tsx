import { useEffect, useRef, type ReactNode } from "react";

type ChatThreadProps = {
  children: ReactNode;
  messages?: readonly unknown[];
};

export function ChatThread({ children, messages = [] }: ChatThreadProps): JSX.Element {
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;

    node.scrollTop = node.scrollHeight;
  }, [messages.length]);

  return (
    <section
      ref={threadRef}
      aria-label="Nura conversation"
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3 pt-3 sm:px-5"
    >
      {children}
    </section>
  );
}
