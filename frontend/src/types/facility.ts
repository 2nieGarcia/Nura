export type FacilitySource =
  | "YAKAP"
  | "MALASAKIT"
  | "LGU"
  | "OSM"
  | "GOOGLE_MAPS"
  | "PHILCARE_2024";

export type DataReliability = "HIGH" | "MEDIUM" | "LOW";

export type Facility = {
  id?: string;
  name: string;
  address: string;
  distance_km?: number;
  benefit_to_claim?: string;
  what_to_say?: string;
  what_to_bring?: string;
  hours?: string;
  maps_url?: string;
  latitude?: number;
  longitude?: number;
  data_source: FacilitySource;
  data_year?: number;
  data_reliability?: DataReliability;
  is_emergency_capable?: boolean;
};
