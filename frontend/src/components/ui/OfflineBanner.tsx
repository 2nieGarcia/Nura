import { APP_COPY } from "../../constants/app";
import { getCachedResults } from "../../lib/storage";

type OfflineBannerProps = {
  isOnline: boolean;
};

export function OfflineBanner({ isOnline }: OfflineBannerProps): JSX.Element | null {
  if (isOnline) return null;

  const cached = getCachedResults();

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900"
      role="status"
      aria-live="polite"
    >
      {cached ? APP_COPY.offlineWarning : APP_COPY.offlineNoCache}
    </div>
  );
}
