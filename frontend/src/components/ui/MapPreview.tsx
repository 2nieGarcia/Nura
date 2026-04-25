type MapPreviewProps = {
  lat: number;
  lng: number;
  name: string;
};

export function MapPreview({ lat, lng, name }: MapPreviewProps): JSX.Element {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  // Option A — OpenStreetMap embed (FREE, no API key)
  const renderOSM = () => {
    const bbox = `${lng - 0.005},${lat - 0.003},${lng + 0.005},${lat + 0.003}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    
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

  // Option B — Google Maps Embed (needs API key)
  const renderGoogle = (key: string) => {
    const src = `https://www.google.com/maps/embed/v1/place?key=${key}&q=${lat},${lng}&zoom=15`;
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

  return (
    <div className="mt-4 overflow-hidden rounded-form border border-paper-edge bg-paper-edge/10">
      {apiKey ? renderGoogle(apiKey) : renderOSM()}
    </div>
  );
}
