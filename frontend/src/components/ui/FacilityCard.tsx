import type { Facility } from "../../types/facility";
import { getDepartmentHint } from "../../constants/departments";
import { getDirectionsUrl, getFacilityCoordinates } from "../../lib/maps";
import { MapPreview } from "./MapPreview";

/**
 * Two facility components living together because they describe one object
 * at two hierarchy levels. Imported from the same path as before so existing
 * imports keep working.
 *
 *   <PrimaryRecommendation />  — Zone 1 of the new Results screen.
 *   <AlternateRow />           — Zone 3 of the new Results screen.
 *
 * Why split:
 * - The previous single FacilityCard rendered the same 9 sections for every
 *   result. Three "equal" cards force the user to compare and choose, which
 *   is exactly what a navigator should do *for* them.
 * - The primary recommendation now answers "where do I go?" with one giant
 *   Maps CTA and one tappable copy-address fallback.
 * - Alternates are demoted to a single line + "Tingnan" link — present, but
 *   never competing for attention with The Answer.
 */

// ── Helpers ───────────────────────────────────────────────────────────────
function describeSource(facility: Facility): string {
  // Replaces the previous corner badges. Trust is shown as a sentence the
  // user can actually read, in plain Filipino.
  const sourceLabels: Record<string, string> = {
    YAKAP: "PhilHealth YAKAP facility roster",
    MALASAKIT: "DOH Malasakit Center directory",
    LGU: "LGU health office directory",
    OSM: "OpenStreetMap (community-verified)",
    GOOGLE_MAPS: "Google Maps public listing",
    PHILCARE_2024: "PhilCare provider list (2024)",
  };
  const base = sourceLabels[facility.data_source] ?? "Verified source";
  const year = facility.data_year ? `, na-update ${facility.data_year}` : "";
  return `Source: ${base}${year}.`;
}

function copyAddress(text: string): void {
  // Navigator.clipboard may be undefined in older Android webviews — we
  // gracefully fall back to a no-op rather than crashing the demo.
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    void navigator.clipboard.writeText(text).catch(() => undefined);
  }
}

function facilityDomId(facility: Facility): string {
  return (facility.id ?? facility.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Primary recommendation (Zone 1) ───────────────────────────────────────
export function PrimaryRecommendation({
  facility,
  concern,
}: {
  facility: Facility;
  concern: string;
}): JSX.Element {
  const domId = facilityDomId(facility) || "facility";
  const coords = getFacilityCoordinates(facility);
  const directionsUrl = getDirectionsUrl(coords, facility.maps_url);
  const departmentHint = getDepartmentHint(concern);
  const distance = typeof facility.distance_km === "number"
    ? `${facility.distance_km.toFixed(1)} km`
    : null;

  return (
    <article className="overflow-hidden rounded-form border border-paper-edge bg-card shadow-sm">
      {/* Stamp-style label — does the work the old "Recommended" header used to. */}
      <div className="flex items-center gap-2 border-b border-paper-edge bg-paper/55 px-4 py-2">
        <span className="inline-block h-2 w-2 rounded-stamp bg-seal" aria-hidden="true" />
        <span className="font-mono text-label uppercase text-seal">
          Unang rekomenda
        </span>
      </div>

      <div className="px-4 py-4">
        <h2 className="font-display text-[1.22rem] leading-7 text-ink">
          {facility.name}
        </h2>
        {departmentHint && (
          <p className="mt-2 rounded-form border border-pin/25 bg-pin-soft px-3 py-2 text-meta font-semibold text-seal">
            📋 Pumunta sa: {departmentHint} (i-confirm sa Information Desk)
          </p>
        )}
        <p className="mt-1 text-body text-ink-soft">{facility.address}</p>

        <MapPreview
          lat={coords?.lat}
          lng={coords?.lng}
          name={facility.name}
          address={facility.address}
          mapsUrl={facility.maps_url}
        />

        {/* Tabular meta on its own row. Mono = "data, not prose". */}
        {(distance || facility.hours) && (
          <p className="mt-2 font-mono text-meta text-ink-soft">
            {distance && <span>{distance}</span>}
            {distance && facility.hours && <span aria-hidden="true"> · </span>}
            {facility.hours && <span>{facility.hours}</span>}
          </p>
        )}

        {/* One-sentence reason this is the answer. Concern echoed back so the
            user knows the system actually heard them. */}
        {facility.benefit_to_claim && (
          <p className="mt-4 rounded-form border border-paper-edge bg-paper/60 px-3 py-3 text-body text-ink">
            Pumunta dito para sa <span className="font-semibold">{concern || "iyong concern"}</span>.{" "}
            <span className="text-ink-soft">{facility.benefit_to_claim}</span>
          </p>
        )}

        {/* Two-up instructional zone. Labels do the work emoji used to do. */}
        {(facility.what_to_bring || facility.what_to_say) && (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {facility.what_to_bring && (
              <div className="rounded-form border border-paper-edge bg-paper/45 px-3 py-3">
                <p className="font-mono text-label uppercase text-ink-soft">
                  Dalhin mo
                </p>
                <p className="mt-1 text-body text-ink">{facility.what_to_bring}</p>
              </div>
            )}
            {facility.what_to_say && (
              <div className="rounded-form border border-paper-edge bg-paper/45 px-3 py-3">
                <p className="font-mono text-label uppercase text-ink-soft">
                  Sasabihin mo sa front desk
                </p>
                <blockquote className="mt-1 text-body font-semibold text-ink">
                  {facility.what_to_say}
                </blockquote>
              </div>
            )}
          </div>
        )}

        {/* Caution sentence (PhilCare data is older). Left rule, no card. */}
        {facility.data_source === "PHILCARE_2024" && (
          <p className="mt-4 rounded-form border border-mark/40 bg-mark-bg px-3 py-2 text-meta text-ink">
            Paalala: ang PhilCare provider list ay mula 2024. Tumawag muna bago pumunta para
            ma-confirm.
          </p>
        )}

        {/* Stacked CTAs. Maps is primary — it's literally the next action. */}
        <div className="mt-5 grid grid-cols-1 gap-2">
          {directionsUrl && (
            <a
              id={`primary-directions-${domId}`}
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-form bg-seal px-5 text-body font-semibold text-card transition-colors hover:bg-seal-press active:bg-seal-press"
            >
              🧭 Directions
            </a>
          )}
          <button
            id={`copy-address-${domId}`}
            type="button"
            onClick={() => copyAddress(facility.address)}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-form border border-paper-edge bg-card px-5 text-body font-semibold text-ink transition-colors hover:border-seal hover:bg-pin-soft hover:text-seal"
          >
            Kopyahin ang address
          </button>
        </div>
      </div>

      {/* Source sentence. Replaces the corner badges. */}
      <p className="border-t border-paper-edge px-4 py-3 text-meta text-ink-soft">
        {describeSource(facility)} Hindi ito medical advice.
      </p>
    </article>
  );
}

// ── Alternate row (Zone 3) ────────────────────────────────────────────────
export function AlternateRow({ facility }: { facility: Facility }): JSX.Element {
  const directionsUrl = getDirectionsUrl(getFacilityCoordinates(facility), facility.maps_url);
  const distance = typeof facility.distance_km === "number"
    ? `${facility.distance_km.toFixed(1)} km`
    : "";

  return (
    <li className="flex flex-col gap-2 border-b border-paper-edge py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between">
      <div className="min-w-0">
        <p className="text-body font-semibold text-ink">{facility.name}</p>
        <p className="mt-0.5 text-meta text-ink-soft">{facility.address}</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        {distance && (
          <span className="font-mono text-meta text-ink-soft">{distance}</span>
        )}
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            id={`alternate-directions-${facilityDomId(facility) || "facility"}`}
            className="inline-flex min-h-9 items-center rounded-form border border-paper-edge px-3 text-body font-semibold text-seal transition-colors hover:border-seal hover:bg-pin-soft"
          >
            Tingnan&nbsp;↗
          </a>
        )}
      </div>
    </li>
  );
}

// Backward-compat default export: some old callers may still import
// `FacilityCard`. Map it to PrimaryRecommendation for safety.
export function FacilityCard({
  facility,
}: {
  facility: Facility;
  index?: number;
}): JSX.Element {
  return <PrimaryRecommendation facility={facility} concern="" />;
}
