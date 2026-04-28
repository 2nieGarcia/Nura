import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
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
  const [showQrCode, setShowQrCode] = useState(false);
  const coords = getPassCoords(pass);
  const directionsUrl = getDirectionsUrl(coords, pass.mapsUrl ?? undefined);
  const qrDirectionsUrl = coords
    ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}&destination_place_id=${encodeURIComponent(pass.facilityName)}`
    : null;
  const savedDate = new Date(pass.savedAt).toLocaleString("fil-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <article className="message-enter w-full max-w-[30rem] overflow-hidden rounded-form border border-paper-edge bg-card shadow-sm">
      <div className="flex items-start gap-3 border-b border-paper-edge bg-paper/55 px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-label uppercase text-seal">
            Last Care Pass
          </p>
          <p className="mt-1 text-meta text-ink-soft">Na-save: {savedDate}</p>
        </div>
        <button
          id="care-pass-close-button"
          type="button"
          onClick={onClose}
          className="ml-auto inline-flex min-h-9 items-center rounded-form border border-paper-edge bg-card px-3 text-meta font-semibold text-ink-soft transition-colors hover:border-seal hover:text-seal"
        >
          Isara
        </button>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div>
          <p className="font-mono text-label uppercase text-ink-soft">Concern</p>
          <p className="mt-1 text-body text-ink">{pass.concern}</p>
        </div>

        <div>
          <p className="font-mono text-label uppercase text-ink-soft">
            Location at benefit
          </p>
          <p className="mt-1 text-body text-ink">
            {pass.location} · {pass.benefitsSummary}
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
          <p className="rounded-form border border-paper-edge bg-paper/60 px-3 py-3 text-body text-ink">
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <a
              id="care-pass-directions-button"
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center rounded-form bg-seal px-5 text-body font-semibold text-card transition-colors hover:bg-seal-press active:bg-seal-press"
            >
              Directions
            </a>
            {qrDirectionsUrl && (
              <button
                id="care-pass-qr-button"
                type="button"
                onClick={() => setShowQrCode(true)}
                className="inline-flex min-h-[48px] items-center justify-center rounded-form border border-paper-edge bg-card px-5 text-body font-semibold text-seal transition-colors hover:border-seal hover:bg-pin-soft"
              >
                📱 QR Code
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-paper-edge px-4 py-3">
        <p className="min-w-0 flex-1 text-meta text-ink-mute">
          Hindi ito medical advice. Gabay lang sa pasilidad at benepisyo.
        </p>
        <button
          id="care-pass-clear-button"
          type="button"
          onClick={onClear}
          className="rounded-form px-3 py-2 text-meta font-semibold text-ink-mute transition-colors hover:bg-stamp-bg hover:text-stamp"
        >
          Burahin
        </button>
      </div>

      {showQrCode && qrDirectionsUrl && (
        <div
          id="care-pass-qr-modal"
          role="dialog"
          aria-modal="true"
          aria-label="QR Code directions"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-[18rem] rounded-form border border-paper-edge bg-card p-5 text-center shadow-lg">
            <div className="mx-auto grid h-[200px] w-[200px] place-items-center rounded-form bg-white p-3">
              <QRCodeSVG
                value={qrDirectionsUrl}
                size={176}
                bgColor="#FFFFFF"
                fgColor="#0E2A3F"
                level="M"
              />
            </div>
            <p className="mt-3 text-body text-ink">
              I-scan para makuha ang directions sa Maps
            </p>
            <button
              id="care-pass-qr-close-button"
              type="button"
              onClick={() => setShowQrCode(false)}
              className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-form bg-seal px-5 text-body font-semibold text-card transition-colors hover:bg-seal-press"
            >
              Isara
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
