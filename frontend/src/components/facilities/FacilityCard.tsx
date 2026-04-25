import type { Facility } from "../../types/facility";

type FacilityCardProps = {
  facility: Facility;
};

function badgeClass(value: Facility["data_reliability"]): string {
  if (value === "HIGH") {
    return "bg-emerald-100 text-emerald-900";
  }

  if (value === "MEDIUM") {
    return "bg-amber-100 text-amber-900";
  }

  return "bg-rose-100 text-rose-900";
}

export function FacilityCard({ facility }: FacilityCardProps): JSX.Element {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{facility.name}</h3>
        {facility.data_reliability ? (
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeClass(facility.data_reliability)}`}>
            {facility.data_reliability}
          </span>
        ) : null}
        <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-900">
          {facility.data_source}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-700">{facility.address}</p>
      {facility.distance_km ? <p className="mt-1 text-sm text-slate-700">Distance: {facility.distance_km} km</p> : null}
      {facility.benefit_to_claim ? <p className="mt-2 text-sm text-slate-700">Benefit: {facility.benefit_to_claim}</p> : null}
      {facility.what_to_bring ? <p className="mt-1 text-sm text-slate-700">Bring: {facility.what_to_bring}</p> : null}
      {facility.what_to_say ? <p className="mt-1 text-sm text-slate-700">Say: {facility.what_to_say}</p> : null}
      {facility.hours ? <p className="mt-1 text-sm text-slate-700">Hours: {facility.hours}</p> : null}

      {facility.data_source === "PHILCARE_2024" ? (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Paalala: Ang PhilCare facility data namin ay mula 2024. Tumawag muna bago pumunta para ma-confirm kung active pa.
        </p>
      ) : null}

      {facility.maps_url ? (
        <a
          className="mt-3 inline-flex rounded-lg bg-service-accent px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800"
          href={facility.maps_url}
          target="_blank"
          rel="noreferrer"
        >
          Open in Google Maps
        </a>
      ) : null}
    </article>
  );
}
