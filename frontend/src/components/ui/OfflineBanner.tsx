import { APP_COPY } from "../../constants/app";
import { getCachedResults } from "../../lib/storage";

/**
 * OfflineBanner — in-flow connectivity status.
 *
 * Fix vs. previous version:
 * - The old banner was `position: fixed; top: 0` and overlapped the header on
 *   small screens (D1 in the audit).
 * - It now renders inline at the top of <main>, never occluding the
 *   letterhead, and uses a left mark-rule + caution color (no card, no
 *   shadow) — same visual register as a clinic-form notice.
 * - role="status" + polite live region so AT users hear the change without
 *   interruption.
 */
type OfflineBannerProps = {
  isOnline: boolean;
};

export function OfflineBanner({ isOnline }: OfflineBannerProps): JSX.Element | null {
  if (isOnline) return null;
  const cached = getCachedResults();

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-4 mt-3 rounded-form border border-mark/40 bg-mark-bg px-3 py-2 text-meta text-ink sm:mx-5"
    >
      {cached ? APP_COPY.offlineWarning : APP_COPY.offlineNoCache}
    </div>
  );
}
