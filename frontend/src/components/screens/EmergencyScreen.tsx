import { APP_COPY } from "../../constants/app";

type EmergencyScreenProps = {
  onDismiss: () => void;
};

export function EmergencyScreen({ onDismiss }: EmergencyScreenProps): JSX.Element {
  return (
    <div className="screen-enter flex min-h-[100dvh] flex-col items-center justify-center bg-nura-emergency-bg px-6 py-12 text-center">
      {/* Alert icon */}
      <div className="emergency-pulse mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-nura-emergency">
        <span className="text-3xl text-white">⚠️</span>
      </div>

      {/* Message */}
      <h2 className="text-2xl font-bold text-nura-emergency">
        EMERGENCY ITO
      </h2>
      <p className="mt-4 max-w-sm text-base leading-relaxed text-nura-text">
        {APP_COPY.emergencyMessage}
      </p>

      {/* Call 911 */}
      <a
        href="tel:911"
        className="mt-8 flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-nura-emergency px-6 py-4 text-lg font-bold text-white shadow-card transition-all hover:bg-rose-800 active:scale-[0.98]"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
        Tumawag sa 911
      </a>

      {/* Dismiss */}
      <button
        type="button"
        onClick={onDismiss}
        className="mt-6 text-sm text-nura-muted underline underline-offset-2 transition-colors hover:text-nura-text"
      >
        {APP_COPY.emergencyNotReally}
      </button>
    </div>
  );
}
