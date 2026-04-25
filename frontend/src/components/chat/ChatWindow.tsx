import type { ChatMessage } from "../../types/chat";

type ChatWindowProps = {
  messages: ChatMessage[];
  isLoading: boolean;
};

function roleLabel(role: ChatMessage["role"]): string {
  if (role === "assistant") {
    return "Nura";
  }

  if (role === "system") {
    return "System";
  }

  return "You";
}

export function ChatWindow({ messages, isLoading }: ChatWindowProps): JSX.Element {
  return (
    <section className="rounded-2xl bg-service-card p-4 shadow-panel" aria-label="Conversation">
      <ol className="space-y-3" role="log" aria-live="polite">
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <li key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <article
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? "bg-service-primary text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-900"
                }`}
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-80">
                  {roleLabel(message.role)}
                </p>
                <p>{message.content}</p>
              </article>
            </li>
          );
        })}
      </ol>

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-600" role="status">
          Pinoproseso ang request mo...
        </p>
      ) : null}
    </section>
  );
}
