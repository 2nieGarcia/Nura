import { APP_COPY } from "../../constants/app";

export function LoadingScreen(): JSX.Element {
  return (
    <div className="screen-enter flex flex-1 flex-col items-center justify-center px-6 py-12">
      {/* Pulsing indicator */}
      <div className="flex items-center gap-3">
        <div className="skeleton-pulse h-3 w-3 rounded-full bg-nura-primary" style={{ animationDelay: "0ms" }} />
        <div className="skeleton-pulse h-3 w-3 rounded-full bg-nura-primary" style={{ animationDelay: "200ms" }} />
        <div className="skeleton-pulse h-3 w-3 rounded-full bg-nura-primary" style={{ animationDelay: "400ms" }} />
      </div>

      <p className="mt-6 text-sm font-medium text-nura-text-light">
        {APP_COPY.loadingText}
      </p>

      {/* Skeleton preview */}
      <div className="mt-8 w-full max-w-sm space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <div className="skeleton-pulse h-4 w-3/4 rounded bg-nura-border" />
          <div className="skeleton-pulse mt-3 h-3 w-full rounded bg-nura-border-light" />
          <div className="skeleton-pulse mt-2 h-3 w-5/6 rounded bg-nura-border-light" />
          <div className="skeleton-pulse mt-4 h-16 w-full rounded-xl bg-nura-border-light" />
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <div className="skeleton-pulse h-4 w-2/3 rounded bg-nura-border" />
          <div className="skeleton-pulse mt-3 h-3 w-full rounded bg-nura-border-light" />
          <div className="skeleton-pulse mt-2 h-3 w-4/5 rounded bg-nura-border-light" />
        </div>
      </div>
    </div>
  );
}
