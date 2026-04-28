import type { ReactNode } from "react";

type UserBubbleProps = {
  children: ReactNode;
};

export function UserBubble({ children }: UserBubbleProps): JSX.Element {
  return (
    <div className="message-enter ml-auto max-w-[min(84%,24rem)] rounded-form bg-seal px-3.5 py-3 text-body font-medium leading-6 text-card shadow-sm">
      {children}
    </div>
  );
}
