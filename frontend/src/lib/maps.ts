export type LatLng = {
  lat: number;
  lng: number;
};

type FacilityLocationFields = {
  latitude?: number;
  longitude?: number;
  maps_url?: string;
};

function isFiniteCoordinate(value: number): boolean {
  return Number.isFinite(value);
}

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    isFiniteCoordinate(lat) &&
    isFiniteCoordinate(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function extractLatLng(mapsUrl?: string | null): LatLng | null {
  if (!mapsUrl) return null;

  const decoded = decodeURIComponent(mapsUrl);
  const match =
    decoded.match(/[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ??
    decoded.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);

  if (!match) return null;

  const lat = Number.parseFloat(match[1] ?? "");
  const lng = Number.parseFloat(match[2] ?? "");

  if (!isValidLatLng(lat, lng)) return null;
  return { lat, lng };
}

export function getFacilityCoordinates(
  facility: FacilityLocationFields
): LatLng | null {
  if (
    typeof facility.latitude === "number" &&
    typeof facility.longitude === "number" &&
    isValidLatLng(facility.latitude, facility.longitude)
  ) {
    return {
      lat: facility.latitude,
      lng: facility.longitude,
    };
  }

  return extractLatLng(facility.maps_url);
}

export function getDirectionsUrl(coords: LatLng | null, fallbackUrl?: string): string | null {
  if (coords) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  }

  return fallbackUrl ?? null;
}
