type MapPreviewProps = {
  lat?: number | null;
  lng?: number | null;
  name: string;
  address?: string | null;
  mapsUrl?: string | null;
};

function hasCoords(lat?: number | null, lng?: number | null): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  );
}

function buildSearchQuery(name: string, address?: string | null): string {
  return [name, address].filter(Boolean).join(", ");
}

export function MapPreview({
  lat,
  lng,
  name,
  address,
  mapsUrl,
}: MapPreviewProps): JSX.Element {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const searchQuery = buildSearchQuery(name, address);
  const encodedQuery = encodeURIComponent(searchQuery || mapsUrl || name);
  const canUseCoordinates = hasCoords(lat, lng);

  const renderOSM = () => {
    if (!canUseCoordinates) return null;

    const latitude = lat as number;
    const longitude = lng as number;
    const bbox = `${longitude - 0.005},${latitude - 0.003},${longitude + 0.005},${latitude + 0.003}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;

    return (
      <iframe
        title={`Map: ${name}`}
        src={src}
        width="100%"
        height="180"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  };

  const renderGoogle = (key: string) => {
    const query = canUseCoordinates ? `${lat as number},${lng as number}` : searchQuery;
    const src = `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(query)}&zoom=15`;

    return (
      <iframe
        title={`Map: ${name}`}
        src={src}
        width="100%"
        height="180"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
      />
    );
  };

  const renderGoogleSearch = () => {
    const src = `https://www.google.com/maps?q=${encodedQuery}&output=embed`;

    return (
      <iframe
        title={`Map search: ${name}`}
        src={src}
        width="100%"
        height="180"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  };

  return (
    <div className="mt-4 overflow-hidden rounded-form border border-paper-edge bg-paper-edge/10">
      {apiKey ? renderGoogle(apiKey) : canUseCoordinates ? renderOSM() : renderGoogleSearch()}
    </div>
  );
}
