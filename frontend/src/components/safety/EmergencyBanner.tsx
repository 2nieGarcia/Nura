import { APP_COPY } from "../../constants/app";

export function EmergencyBanner(): JSX.Element {
  return (
    <section
      className="mt-4 rounded-xl border-2 border-rose-800 bg-rose-100 px-4 py-3 text-rose-900"
      role="alert"
      aria-live="assertive"
    >
      <h2 className="text-base font-bold">Emergency Alert</h2>
      <p className="mt-1 text-sm">{APP_COPY.emergencyMessage}</p>
    </section>
  );
}
