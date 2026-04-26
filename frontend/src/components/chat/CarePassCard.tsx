import { getDirectionsUrl, type LatLng } from "../../lib/maps";
import type { CarePass } from "../../lib/storage";
import { MapPreview } from "../ui/MapPreview";

type CarePassCardProps = {
  pass: CarePass;
  onClose: () => void;
  onClear: () => void;
};

function getPassCoords(pass: CarePass): LatLng | null {
  if (typeof pass.lat === "number" && typeof pass.lng === "number") {
    return { lat: pass.lat, lng: pass.lng };
  }

  return null;
}

export function CarePassCard({
  pass,
  onClose,
  onClear,
}: CarePassCardProps): JSX.Element {
  const coords = getPassCoords(pass);
  const directionsUrl = getDirectionsUrl(coords, pass.mapsUrl ?? undefined);
  const savedDate = new Date(pass.savedAt).toLocaleString("fil-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <article className="message-enter rounded-block border border-paper-edge bg-card shadow-sm">
      <div className="flex items-start gap-3 border-b border-paper-edge px-5 py-3">
        <div className="min-w-0">
          <p className="font-mono text-label uppercase text-seal">
            Last Care Pass
          </p>
          <p className="mt-1 text-meta text-ink-soft">Na-save: {savedDate}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-form border border-paper-edge px-3 py-1 text-meta font-semibold text-ink-soft transition-colors hover:border-seal hover:text-seal"
        >
          Isara
        </button>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <p className="font-mono text-label uppercase text-ink-soft">Concern</p>
          <p className="mt-1 text-body text-ink">{pass.concern}</p>
        </div>

        <div>
          <p className="font-mono text-label uppercase text-ink-soft">
            Location at benefit
          </p>
          <p className="mt-1 text-body text-ink">
            {pass.location} - {pass.benefitsSummary}
          </p>
        </div>

        <div>
          <p className="font-mono text-label uppercase text-ink-soft">
            Rekomendang pasilidad
          </p>
          <p className="mt-1 font-display text-title text-ink">
            {pass.facilityName}
          </p>
          <p className="mt-1 text-body text-ink-soft">{pass.facilityAddress}</p>
          <MapPreview
            lat={coords?.lat}
            lng={coords?.lng}
            name={pass.facilityName}
            address={pass.facilityAddress}
            mapsUrl={pass.mapsUrl}
          />
        </div>

        {pass.benefitToClaim && (
          <p className="border-l-rule border-seal pl-3 text-body text-ink">
            {pass.benefitToClaim}
          </p>
        )}

        {pass.whatToBring && (
          <div>
            <p className="font-mono text-label uppercase text-ink-soft">
              Dalhin mo
            </p>
            <p className="mt-1 text-body text-ink">{pass.whatToBring}</p>
          </div>
        )}

        {pass.whatToSay && (
          <div>
            <p className="font-mono text-label uppercase text-ink-soft">
              Sasabihin mo sa front desk
            </p>
            <blockquote className="mt-1 font-display text-body-lg italic text-ink">
              {pass.whatToSay}
            </blockquote>
          </div>
        )}

        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-form bg-seal px-5 text-body font-semibold text-card transition-colors hover:bg-seal-press active:bg-seal-press"
          >
            Directions
          </a>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-paper-edge px-5 py-3">
        <p className="min-w-0 flex-1 text-meta text-ink-mute">
          Hindi ito medical advice. Gabay lang sa pasilidad at benepisyo.
        </p>
        <button
          type="button"
          onClick={onClear}
          className="rounded-form px-3 py-2 text-meta font-semibold text-ink-mute transition-colors hover:bg-stamp-bg hover:text-stamp"
        >
          Burahin
        </button>
      </div>
    </article>
  );
}
