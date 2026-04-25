import { APP_COPY } from "../../constants/app";

type WelcomeScreenProps = {
  onStart: () => void;
};

export function WelcomeScreen({ onStart }: WelcomeScreenProps): JSX.Element {
  return (
    <div className="screen-enter flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      {/* Logo */}
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-nura-primary shadow-card">
        <span className="text-3xl font-bold text-white">N</span>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold tracking-tight text-nura-text">
        {APP_COPY.title}
      </h2>
      <p className="mt-2 text-sm font-medium text-nura-primary">
        Kalusugan Navigator
      </p>

      {/* Tagline */}
      <p className="mt-6 max-w-xs text-sm leading-relaxed text-nura-text-light">
        {APP_COPY.tagline}
      </p>

      {/* CTA */}
      <button
        type="button"
        onClick={onStart}
        className="mt-10 w-full max-w-xs rounded-2xl bg-nura-primary px-6 py-4 text-base font-semibold text-white shadow-card transition-all duration-150 hover:bg-nura-primary-hover hover:shadow-card-hover active:scale-[0.98]"
      >
        {APP_COPY.ctaStart}
      </button>

      {/* Privacy note */}
      <p className="mt-6 text-xs text-nura-muted">
        {APP_COPY.privacyNote}
      </p>

      {/* Disclaimer */}
      <div className="mt-8 rounded-xl border border-nura-border bg-white px-4 py-3">
        <p className="text-[11px] leading-relaxed text-nura-muted">
          Hindi ito medical advice. Hindi kami doktor. Tutulong lang kami saan ka pwedeng magpatingin at anong benefit ang pwede mong gamitin.
        </p>
      </div>
    </div>
  );
}
