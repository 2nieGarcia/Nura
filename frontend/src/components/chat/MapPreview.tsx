type MapPreviewProps = {
  lat: number;
  lng: number;
  facilityName: string;
};

export function MapPreview({
  lat,
  lng,
  facilityName,
}: MapPreviewProps): JSX.Element {
  const bbox = `${lng - 0.005},${lat - 0.003},${lng + 0.005},${lat + 0.003}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="mt-3 overflow-hidden rounded-form border border-paper-edge bg-paper-edge/10">
      <iframe
        id={`map-preview-${facilityName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}`}
        title={`Mapa: ${facilityName}`}
        src={src}
        width="100%"
        height="180"
        className="block h-40 w-full sm:h-[180px]"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
