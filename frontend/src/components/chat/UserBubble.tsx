import type { ReactNode } from "react";

type UserBubbleProps = {
  children: ReactNode;
};

export function UserBubble({ children }: UserBubbleProps): JSX.Element {
  return (
    <div className="message-enter ml-auto max-w-[75%] rounded-bl-block rounded-br-block rounded-tl-block rounded-tr-[2px] bg-seal px-4 py-3 text-body font-medium text-card shadow-sm">
      {children}
    </div>
  );
}
