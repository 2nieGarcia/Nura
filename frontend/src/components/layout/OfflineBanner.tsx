import { APP_COPY } from "../../constants/app";

type OfflineBannerProps = {
  isOnline: boolean;
};

export function OfflineBanner({ isOnline }: OfflineBannerProps): JSX.Element | null {
  if (isOnline) {
    return null;
  }

  return (
    <div
      className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"
      role="status"
      aria-live="polite"
    >
      {APP_COPY.offlineWarning}
    </div>
  );
}
