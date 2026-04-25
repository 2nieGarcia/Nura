import type { Facility } from "../../types/facility";

type FacilityCardProps = {
  facility: Facility;
  index: number;
};

function reliabilityBadge(value: Facility["data_reliability"]): {
  bg: string;
  label: string;
} {
  switch (value) {
    case "HIGH":
      return { bg: "bg-emerald-50 text-emerald-800", label: "Verified" };
    case "MEDIUM":
      return { bg: "bg-amber-50 text-amber-800", label: "Partial" };
    case "LOW":
      return { bg: "bg-rose-50 text-rose-800", label: "Unverified" };
    default:
      return { bg: "bg-slate-50 text-slate-600", label: "Unknown" };
  }
}

export function FacilityCard({ facility, index }: FacilityCardProps): JSX.Element {
  const badge = reliabilityBadge(facility.data_reliability);

  return (
    <article
      className="card-stagger rounded-2xl bg-white p-5 shadow-card"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug text-nura-text">
          {facility.name}
        </h3>
        {facility.distance_km != null && (
          <span className="flex-shrink-0 rounded-full bg-nura-accent/10 px-2.5 py-1 text-xs font-semibold text-nura-accent">
            {facility.distance_km} km
          </span>
        )}
      </div>

      {/* Address */}
      <p className="mt-2 text-sm text-nura-text-light">{facility.address}</p>

      {/* Benefit highlight */}
      {facility.benefit_to_claim && (
        <div className="mt-3 rounded-xl bg-nura-primary/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-nura-primary">
            Benefit
          </p>
          <p className="mt-1 text-sm font-medium text-nura-text">
            {facility.benefit_to_claim}
          </p>
        </div>
      )}

      {/* Front-desk script — the demo moment */}
      {facility.what_to_say && (
        <div className="mt-3 rounded-xl border-l-4 border-nura-primary bg-nura-primary/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-nura-primary">
            💬 Sasabihin mo
          </p>
          <p className="mt-1 text-sm italic leading-relaxed text-nura-text">
            {facility.what_to_say}
          </p>
        </div>
      )}

      {/* What to bring */}
      {facility.what_to_bring && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-nura-muted">
            📋 Dadalhin
          </p>
          <p className="mt-1 text-sm text-nura-text-light">
            {facility.what_to_bring}
          </p>
        </div>
      )}

      {/* Hours */}
      {facility.hours && (
        <p className="mt-3 text-xs text-nura-muted">
          🕐 {facility.hours}
        </p>
      )}

      {/* PhilCare warning */}
      {facility.data_source === "PHILCARE_2024" && (
        <div className="mt-3 rounded-lg bg-nura-warning-bg px-3 py-2 text-xs text-nura-warning">
          Paalala: Ang PhilCare data ay mula 2024. Tumawag muna bago pumunta para ma-confirm.
        </div>
      )}

      {/* Footer: Maps + badges */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {facility.maps_url && (
          <a
            href={facility.maps_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-nura-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-nura-accent-hover"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Directions
          </a>
        )}
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${badge.bg}`}>
          {badge.label}
        </span>
        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500">
          {facility.data_source}
          {facility.data_year ? ` ${facility.data_year}` : ""}
        </span>
      </div>
    </article>
  );
}
